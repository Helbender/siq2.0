import base64
import io
import json
import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials  # type:ignore
from google.oauth2 import service_account  # type:ignore
from google_auth_oauthlib.flow import InstalledAppFlow  # type:ignore
from googleapiclient.discovery import build  # type:ignore
from googleapiclient.http import MediaIoBaseUpload  # type:ignore

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


# SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]


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


def check_dublicates_and_sends(nome_ficheiro, service, pasta_dia_id, media):
    query = f"name = '{nome_ficheiro}' and '{pasta_dia_id}' in parents and trashed = false"
    response = service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
    files = response.get("files", [])

    if files:
        # Ficheiro já existe — faz update
        file_id = files[0]["id"]
        file = service.files().update(fileId=file_id, media_body=media).execute()
        print(f"Ficheiro existente atualizado! ID: {file.get('id')}")
    else:
        # Ficheiro não existe — cria novo
        file_metadata = {"name": nome_ficheiro, "parents": [pasta_dia_id]}
        file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
        print(f"Ficheiro novo criado! ID: {file.get('id')}")


# Função para enviar arquivo ao Google Drive
def enviar_para_drive(mem_pdf: io.BytesIO, nome_ficheiro: str, id_pasta: str):
    # Carrega credenciais do arquivo JSON
    credentials = service_account.Credentials.from_service_account_file("credentials.json", scopes=SCOPES)

    # Cria o cliente para a API do Drive
    service = build("drive", "v3", credentials=credentials)

    data: str = nome_ficheiro.split()[2]
    nome_pasta_dia: str = data[:2]
    nome_pasta_mes: str = data[2:5]
    nome_pasta_ano: str = data[-4:]
    # Retira o mês do nome do ficheiro
    # Retira o dia do nome do ficheiro

    # 2) Garante que a pasta do ano exista dentro da pasta raiz
    pasta_ano_id = get_or_create_folder(service, id_pasta, nome_pasta_ano)

    # 3) Garante que a pasta do mês exista dentro da pasta raiz
    pasta_mes_id = get_or_create_folder(service, pasta_ano_id, nome_pasta_mes)

    # 4) Garante que a pasta do dia exista dentro da pasta do mês
    pasta_dia_id = get_or_create_folder(service, pasta_mes_id, nome_pasta_dia)

    media = MediaIoBaseUpload(mem_pdf, mimetype="application/pdf", resumable=True)

    # Verifica se já existe um ficheiro com o mesmo nome na pasta
    check_dublicates_and_sends(nome_ficheiro, service, pasta_dia_id, media)


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

    # Separa a nata do nome do ficheiro
    data: str = nome_arquivo_drive.split()[2]
    nome_pasta_dia: str = data[:2]
    nome_pasta_mes: str = data[2:5]
    nome_pasta_ano: str = data[-4:]
    # Retira o mês do nome do ficheiro
    # Retira o dia do nome do ficheiro

    # 2) Garante que a pasta do ano exista dentro da pasta raiz
    pasta_ano_id = get_or_create_folder(service, id_pasta, nome_pasta_ano)

    # 3) Garante que a pasta do mês exista dentro da pasta raiz
    pasta_mes_id = get_or_create_folder(service, pasta_ano_id, nome_pasta_mes)

    # 4) Garante que a pasta do dia exista dentro da pasta do mês
    pasta_dia_id = get_or_create_folder(service, pasta_mes_id, nome_pasta_dia)

    dados_binarios = base64.b64encode(json.dumps(dados).encode("utf-8"))
    # dados_binarios = json.dumps(dados).encode("utf-8")
    buffer = io.BytesIO(dados_binarios)
    media = MediaIoBaseUpload(buffer, mimetype="application/octet-stream", resumable=True)

    check_dublicates_and_sends(nome_arquivo_drive, service, pasta_dia_id, media)

    # # Metadados do arquivo
    # file_metadata = {
    #     "name": nome_arquivo_drive,
    #     "parents": [pasta_dia_id],  # Especifica a pasta de destino
    # }
    # # Faz o upload
    # arquivo = service.files().create(body=file_metadata, media_body=media, fields="id").execute()

    # print(f"Arquivo enviado com sucesso para a pasta. ID do arquivo: {arquivo.get('id')}")


def get_or_create_folder(service, parent_id: str, folder_name: str) -> str:
    """
    Verifica se existe uma pasta com 'folder_name' dentro de 'parent_id'.
    Se não existir, cria a pasta.
    Retorna o ID da pasta encontrada ou criada.
    """
    # 1) Tenta achar a pasta por nome dentro de parent_id
    query = (
        f"name = '{folder_name}' "
        f"and mimeType = 'application/vnd.google-apps.folder' "
        f"and '{parent_id}' in parents "
        f"and trashed = false"
    )
    response = service.files().list(q=query, fields="files(id, name)").execute()
    files = response.get("files", [])

    if files:
        # Retorna o primeiro ID encontrado
        return files[0]["id"]
    else:
        # 2) Se não encontrou, cria a pasta
        folder_metadata = {
            "name": folder_name,
            "parents": [parent_id],
            "mimeType": "application/vnd.google-apps.folder",
        }
        folder = service.files().create(body=folder_metadata, fields="id").execute()
        return folder.get("id")


# Usar as funções
if __name__ == "__main__":
    nome_ficheiro: str = "1M 00A1731 07Apr2025 12:05"
    data = nome_ficheiro.split()[2]
    print(data)

    dia = data[:2]
    mes = data[2:5]
    ano = data[-4:]
    print(dia, mes, ano)
    # Conectar ao Google Drive
    # service = autenticar_drive()

    # Nome do arquivo local e o nome que terá no Drive
    # arquivo_local = "functions/dados.bin"  # Arquivo que você quer enviar
    # nome_arquivo_drive = "dados_no_drive.bin"

    # Enviar o arquivo ao Google Drive
    # enviar_dados_para_pasta(service, arquivo_local, nome_arquivo_drive)
