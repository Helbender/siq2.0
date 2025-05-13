from models.users import *
from models.flights import *
from models.pilots import *
from models.crew import *
from sqlalchemy.orm import Session
from sqlalchemy import select

from sqlalchemy import create_engine, exc
from dotenv import load_dotenv

# q = Qualification()

# mapper = inspect(q)

# mylist = [column.name for column in q.__table__.columns]
# # mylist.pop(0)
# mylist = mylist[5:]

# unsorted_dict: dict = {}
# for item in mylist:
#     value = getattr(q, item)
#     unsorted_dict[f"last{item[5:-5].upper()}"] = value
# print(unsorted_dict)


# Load enviroment variables
load_dotenv(dotenv_path=".env")

DB_PASS = "siq"  # "G69ksWgAlMz~")  # Ensure to set this in your .env file
DB_USER = "siq"  # "esqpt_siq2")  # Ensure to set this in your .env file
DB_HOST = "db"  # "esq502.pt")
DB_PORT = 3306  # 3306)
DB_NAME = "siq"  # "esqpt_siq")

# connection_string = "sqlite:///database/mydb.db"

PILOT_USER: list = ["PI", "PC", "CP", "P", "PA"]
CREW_USER: list = ["OC", "OCI", "OCA", "CT", "CTA", "CTI", "OPV", "OPVI", "OPVA"]

# Define connection string
connection_string = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    # Create the SQLAlchemy engine with improved configuration
    engine = create_engine(
        connection_string,
        pool_size=200,  # Adjust based on your needs
        max_overflow=10,  # Allow some overflow
        pool_timeout=30,  # Wait time for getting a connection
        pool_recycle=3600,  # Recycle connections every hour
        pool_pre_ping=True,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database setup completed successfully.")

except exc.SQLAlchemyError as e:
    print(f"An error occurred while setting up the database:\n {e}")

result: list = []

with Session(engine) as session:
    for db in [User, Pilot, Crew]:
        stmt = select(db).order_by(db.nip)
        if session.execute(stmt).scalars().all() is not None:
            result.extend(session.execute(stmt).scalars().all())
l = [row.to_json() for row in result]
ordered_list = sorted(l, key=lambda x: x["nip"])
for r in ordered_list:
    print(r["nip"])
