import base64
import io
import json
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials  # type:ignore
from google.oauth2 import service_account  # type:ignore
from google_auth_oauthlib.flow import InstalledAppFlow  # type:ignore
from googleapiclient.discovery import build  # type:ignore
from googleapiclient.errors import HttpError  # type:ignore
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload  # type:ignore

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


# SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]
def main():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        service = build("drive", "v3", credentials=creds)

        # Call the Drive v3 API
        results = service.files().list(pageSize=10, fields="nextPageToken, files(id, name)").execute()
        items = results.get("files", [])

        if not items:
            print("No files found.")
            return
        print("Files:")
        for item in items:
            print(f"{item['name']} ({item['id']})")
    except HttpError as error:
        # TODO(developer) - Handle errors from drive API.
        print(f"An error occurred: {error}")


# Autenticar e conectar ao Google Drive
def autenticar_drive():
    creds = None
    # Verificar se há credenciais armazenadas
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    # Conectar ao serviço do Google Drive
    return build("drive", "v3", credentials=creds)


# Função para enviar arquivo ao Google Drive
def enviar_para_drive(service, arquivo_local, nome_arquivo_drive):
    file_metadata = {"name": nome_arquivo_drive}
    media = MediaFileUpload(arquivo_local, resumable=True)

    # Criar o arquivo no Google Drive
    arquivo = service.files().create(body=file_metadata, media_body=media, fields="id").execute()

    print(f"Arquivo enviado com sucesso. ID do arquivo: {arquivo.get('id')}")


# Função para enviar dados diretamente para o Google Drive
def enviar_dados_para_pasta(service, dados, nome_arquivo_drive, id_pasta):
    # Criar os dados como um objeto em memória
    dados_binarios = base64.b64encode(json.dumps(dados).encode("utf-8"))
    buffer = io.BytesIO(dados_binarios)

    # Metadata do arquivo, incluindo o ID da pasta
    file_metadata = {
        "name": nome_arquivo_drive,
        "parents": [id_pasta],  # Especifica a pasta de destino
    }

    # Fazer upload do arquivo
    media = MediaIoBaseUpload(buffer, mimetype="application/octet-stream", resumable=True)
    arquivo = service.files().create(body=file_metadata, media_body=media, fields="id").execute()

    print(f"Arquivo enviado com sucesso para a pasta. ID do arquivo: {arquivo.get('id')}")


def upload_with_service_account(dados: dict, nome_arquivo_drive: str, id_pasta: str):
    """
    Faz o upload de um arquivo ao Google Drive usando Service Account.
    :param service_account_json_path: Caminho para o arquivo JSON da conta de serviço
    :param file_name: Nome do arquivo no Drive
    :param file_path: Caminho local do arquivo
    """
    # Carrega credenciais do arquivo JSON
    credentials = service_account.Credentials.from_service_account_file("credentials.json", scopes=SCOPES)

    # Cria o cliente para a API do Drive
    service = build("drive", "v3", credentials=credentials)

    dados_binarios = base64.b64encode(json.dumps(dados).encode("utf-8"))
    # dados_binarios = json.dumps(dados).encode("utf-8")
    buffer = io.BytesIO(dados_binarios)
    print(f"Pasta do Google Drive: {id_pasta}.")
    # Metadados do arquivo
    file_metadata = {
        "name": nome_arquivo_drive,
        "parents": [id_pasta],  # Especifica a pasta de destino
    }
    # Faz o upload
    media = MediaIoBaseUpload(buffer, mimetype="application/octet-stream", resumable=True)
    arquivo = service.files().create(body=file_metadata, media_body=media, fields="id").execute()

    # media = MediaFileUpload(file_path, resumable=True)
    # uploaded_file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()

    print(f"Arquivo enviado com sucesso para a pasta. ID do arquivo: {arquivo.get('id')}")


# Usar as funções
if __name__ == "__main__":
    # Conectar ao Google Drive
    service = autenticar_drive()

    # Nome do arquivo local e o nome que terá no Drive
    arquivo_local = "functions/dados.bin"  # Arquivo que você quer enviar
    nome_arquivo_drive = "dados_no_drive.bin"

    # Enviar o arquivo ao Google Drive
    # enviar_dados_para_pasta(service, arquivo_local, nome_arquivo_drive)
