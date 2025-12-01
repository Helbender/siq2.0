import base64
import io
import json
import logging
import os.path

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2 import service_account  # type:ignore
from google.oauth2.credentials import Credentials  # type:ignore
from google_auth_oauthlib.flow import InstalledAppFlow  # type:ignore
from googleapiclient.discovery import build  # type:ignore
from googleapiclient.http import MediaIoBaseUpload  # type:ignore

from functions.pdfcreator import combinar_template_e_conteudo, gerar_pdf_conteudo_em_memoria  # type: ignore

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/drive.file"]

# Load enviroment variables
load_dotenv(dotenv_path="./.env")
ID_PASTA_VOO = os.environ.get("ID_PASTA_VOO", "")
ID_PASTA_PDF = os.environ.get("ID_PASTA_PDF", "")

logger = logging.getLogger(__name__)

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


def check_dublicates_and_sends(nome_ficheiro: str, service, pasta_dia_id, media):
    query = f"name = '{nome_ficheiro}' and '{pasta_dia_id}' in parents and trashed = false"
    response = service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
    files = response.get("files", [])

    if files:
        # Ficheiro já existe — faz update
        file_id = files[0]["id"]
        file = service.files().update(fileId=file_id, media_body=media).execute()
        if nome_ficheiro.endswith(".pdf"):
            print(f"PDF existente atualizado! ID: {file.get('id')}")
        else:
            print(f"Ficheiro existente atualizado! ID: {file.get('id')}")

    else:
        # Ficheiro não existe — cria novo
        file_metadata = {"name": nome_ficheiro, "parents": [pasta_dia_id]}
        file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
        if nome_ficheiro.endswith(".pdf"):
            print(f"PDF novo criado! ID: {file.get('id')}")
        else:
            print(f"Ficheiro novo criado! ID: {file.get('id')}")


# Função para enviar arquivo ao Google Drive
def enviar_para_drive(mem_pdf: io.BytesIO, nome_ficheiro: str, id_pasta: str):
    """Envia o ficheiro pdf para o google drive

    Args:
        mem_pdf (io.BytesIO): Dados a enviar
        nome_ficheiro (str): Nome do ficheiro a guardar
        id_pasta (str): ID da pasta no Google Drive
    """

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
def enviar_json_para_pasta(dados, nome_arquivo, id_pasta):
    # Carrega credenciais do arquivo JSON
    credentials = service_account.Credentials.from_service_account_file("credentials.json", scopes=SCOPES)

    # Cria o cliente para a API do Drive
    service = build("drive", "v3", credentials=credentials)

    # Converte os dados JSON para um stream de bytes
    json_bytes = io.BytesIO(json.dumps(dados, indent=4).encode("utf-8"))

    # Upload como JSON
    media = MediaIoBaseUpload(json_bytes, mimetype="application/json", resumable=False)

    query = f"name = '{nome_arquivo}' and '{id_pasta}' in parents and trashed = false"
    response = service.files().list(q=query, spaces="drive", fields="files(id, name)").execute()
    files = response.get("files", [])

    if files:
        # Ficheiro já existe — faz update
        file_id = files[0]["id"]
        file = service.files().update(fileId=file_id, media_body=media).execute()
        print(f"Ficheiro existente atualizado! ID: {file.get('id')}")
    else:
        # Define os metadados do ficheiro
        file_metadata = {
            "name": nome_arquivo,  # Ex: "meus_dados.json"
            "parents": [id_pasta],  # ID da pasta de destino
            "mimeType": "application/json",  # Tipo de ficheiro correto
        }

        # Ficheiro não existe — cria novo
        file = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
        print(f"Ficheiro novo criado! ID: {file.get('id')}")

    # # Cria o ficheiro no Google Drive
    # arquivo = service.files().create(body=file_metadata, media_body=media, fields="id").execute()
    # print(f"Arquivo enviado com sucesso para a pasta. ID do arquivo: {arquivo.get('id')}")


def upload_with_service_account(dados: dict, nome_arquivo_drive: str, id_pasta: str):
    """Uploads Flight JSON encoded data to Google Drive.

    Args:
        dados (dict): Dados do voo a serem enviados.
        nome_arquivo_drive (str): Nome do arquivo a ser criado no Google Drive.
        id_pasta (str): Id da pasta do Google Drive base onde o arquivo será enviado.
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


def tarefa_enviar_para_drive(dados: dict, nome_arquivo_drive: str, nome_pdf: str) -> None:
    """Função geral de enviar os dados para os ficheiros no Google Drive.

    Criada para usar multithread e enviar os ficheiros sem as respostas para o Frontend atrasarem

    Args:
        dados (dict): _description_
        nome_arquivo_drive (str): _description_
        nome_pdf (str): _description_
    """
    try:
        upload_with_service_account(dados=dados, nome_arquivo_drive=nome_arquivo_drive, id_pasta=ID_PASTA_VOO)

        enviar_para_drive(
            combinar_template_e_conteudo(
                template_pdf_path="functions/img/Mod1M.pdf",
                conteudo_pdf_io=gerar_pdf_conteudo_em_memoria(dados_voo=dados),
            ),
            nome_ficheiro=nome_pdf,
            id_pasta=ID_PASTA_PDF,
        )
        logger.info(f"Upload para Google Drive concluído: {nome_arquivo_drive}")
    except Exception as e:
        logger.exception(f"Erro ao enviar voo {nome_arquivo_drive} para o Google Drive: {e}")

        # Podes logar o erro aqui ou enviar para uma ferramenta de logging
        print(f"Erro ao enviar para Google Drive: {e}")


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
