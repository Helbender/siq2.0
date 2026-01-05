from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
import os
import io
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

tradutor = {
    "airtask": "AIRTASK",
    "flightType": "MODALIDADE",
    "flightAction": "AÇÃO",
    "tailNumber": "Nº DE AERONAVE",
    "date": "DATA",
    "ATD": "ATD",
    "ATA": "ATA",
    "ATE": "ATE",
    "origin": "ORIGEM",
    "destination": "DESTINO",
}
tradutor2 = {
    "totalLandings": "ATERRAGENS",
    "passengers": "PASSAGEIROS",
    "doe": "DOE",
    "cargo": "CARGA",
    "numberOfCrew": "Nº DE TRIPULANTES",
    "orm": "ORM",
    "fuel": "FUEL",
}


def gerar_pdf_conteudo_em_memoria(dados_voo) -> io.BytesIO:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    # Adicionar logotipo
    caminho_logotipo = os.path.join(os.path.dirname(__file__), "img", "Esquadra_502.png")
    if os.path.isfile(caminho_logotipo):
        c.drawImage(
            caminho_logotipo,
            x=2 * cm,
            y=landscape(A4)[1] - 3 * cm,
            width=3 * cm,
            height=2 * cm,
            preserveAspectRatio=True,
            mask="auto",  # Permite transparência se PNG tiver canal alfa
        )
    # Exemplo: colocar dados sobre o template em coordenadas específicas
    c.setFont("Helvetica", 12)
    c.drawString(285, 450, f"{dados_voo.get('tailNumber', '')}")
    c.drawString(525, 450, f"{dados_voo.get('ATD', '')}")
    c.drawString(577, 450, f"{dados_voo.get('ATA', '')}")
    c.drawString(620, 450, f"{dados_voo.get('ATE', '')}")
    c.drawString(670, 450, f"{dados_voo.get('origin', '')}")
    c.drawString(750, 450, f"{dados_voo.get('destination', '')}")
    c.drawString(417, 415, f"{dados_voo.get('totalLandings', '')}")
    c.drawString(470, 415, f"{dados_voo.get('passengers', '')}")
    c.drawString(520, 415, f"{dados_voo.get('doe', '')}")
    c.drawString(590, 415, f"{dados_voo.get('cargo', '')}")
    c.drawString(680, 415, f"{dados_voo.get('numberOfCrew', '')}")
    c.drawString(735, 415, f"{dados_voo.get('orm', '')}")
    c.drawString(780, 415, f"{dados_voo.get('fuel', '')}")

    c.setFont("Helvetica", 8)
    c.drawString(348, 450, f"{dados_voo.get('date', '')}")

    c.setFont("Helvetica", 6)
    c.drawString(122, 450, f"{dados_voo.get('flightType', '')}")
    c.drawString(148, 450, f"{dados_voo.get('flightAction', '')}")

    if dados_voo.get("Ativação 1º", "__:__") != "__:__":
        c.setFont("Helvetica-Bold", 10)
        c.drawString(700, 575, "Ativação 1º:")
        c.drawString(700, 550, "Ativação Ult:")
        c.drawString(700, 525, "AC Pronta:")
        c.drawString(700, 500, "Equipa Médica:")
        c.setFont("Helvetica", 10)
        c.drawString(775, 575, f"{dados_voo.get('Ativação 1º', '__:__')}")
        c.drawString(775, 550, f"{dados_voo.get('Ativação Ult', '__:__')}")
        c.drawString(775, 525, f"{dados_voo.get('AC Pronta', '__:__')}")
        c.drawString(775, 500, f"{dados_voo.get('Equipa Médica', '__:__')}")

    c.drawString(78, 450, f"{dados_voo.get('airtask', '')}")

    c.setFont("Helvetica", 12)

    qualificacoes = [
        "QA1",
        "QA2",
        "BSP1",
        "BSP2",
        "TA",
        "VRP1",
        "VRP2",
        "CTO",
        "SID",
        "MONO",
        "NFP",
        "BSKIT",
        "BSOC",
    ]
    for i in dados_voo.get("flight_pilots", []):
        c.setFont("Helvetica", 8)
        c.drawString(130, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('nip', '')}")
        c.drawString(180, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('rank', '')}")
        c.drawString(270, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('name', '')}")
        c.drawString(410, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('position', '')}")
        c.drawString(630, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('ATR', '')}")
        c.drawString(665, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('ATN', '')}")
        c.drawString(520, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('precapp', '')}")
        c.drawString(560, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('nprecapp', '')}")

        c.setFont("Helvetica", 7)
        c.drawString(432, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('VIR', '')}")
        c.drawString(456, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('VN', '')}")
        c.drawString(480, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{i.get('CON', '')}")

        c.setFont("Helvetica", 5)
        index = 0
        for f in qualificacoes:
            if i.get(f, False):
                c.drawString(725 + index * 16, 356 - (dados_voo["flight_pilots"].index(i) * 14), f"{f}")
                index += 1

    # Finalizar página
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer


def combinar_template_e_conteudo(template_pdf_path, conteudo_pdf_io, nome_arquivo_saida=None) -> io.BytesIO:
    # Leitura do template
    template_reader = PdfReader(template_pdf_path)
    template_page = template_reader.pages[0]

    # Leitura do conteúdo gerado
    conteudo_reader = PdfReader(conteudo_pdf_io)
    conteudo_page = conteudo_reader.pages[0]

    # Combinar os dois
    template_page.merge_page(conteudo_page)

    # Criar novo PDF com a página combinada
    writer = PdfWriter()
    writer.add_page(template_page)

    # Serve para fazer testes e criar ficheiros localmente
    if nome_arquivo_saida:
        with open(nome_arquivo_saida, "wb") as f:
            writer.write(f)

    # Retornar o PDF em memória
    buffer = io.BytesIO()
    writer.write(buffer)
    buffer.seek(0)
    return buffer


if __name__ == "__main__":
    # === USO ===
    voo = {
        "id": 250,
        "airtask": "00A0000",
        "date": "2025-05-10",
        "origin": "LEMG",
        "destination": "LEMG",
        "ATD": "10:00",
        "ATA": "11:00",
        "ATE": "01:00",
        "flightType": "ADROP",
        "flightAction": "OPER",
        "tailNumber": 16710,
        "totalLandings": 1,
        "passengers": 22,
        "doe": 1,
        "cargo": 100,
        "numberOfCrew": 7,
        "orm": 28,
        "fuel": 4000,
        "Ativação 1º": "10:00",
        "Ativação Ult": "10:00",
        "AC Pronta": "10:00",
        "Equipa Médica": "10:00",
        "flight_pilots": [
            {
                "name": "Tiago Branco",
                "nip": 135885,
                "rank": "CAP",
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135885,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade2",
                "nip": 135885,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135886,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135887,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135888,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135889,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135900,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
            },
            {
                "name": "Pedro Andrade",
                "nip": 135901,
                "position": "PC",
                "VIR": "01:00",
                "VN": "02:00",
                "CON": "03:00",
                "ATR": 1,
                "ATN": 2,
                "precapp": 3,
                "nprecapp": 4,
                "BSKIT": True,
                "BSOC": True,
                "MONO": True,
                "CTO": True,
            },
        ],
    }
    conteudo = gerar_pdf_conteudo_em_memoria(voo)
    combinar_template_e_conteudo("img/Mod1M.pdf", conteudo, "img/Relatorio_Final.pdf")
