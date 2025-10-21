import os

from dotenv import load_dotenv
from models.crew import *
from models.flights import *
from models.pilots import *
from models.users import *
from sqlalchemy import create_engine, exc
from testes.test import test_database_connection

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


# connection_string = "sqlite:///database/mydb.db"

PILOT_USER: list = ["PI", "PC", "CP", "P", "PA"]
CREW_USER: list = ["OC", "OCI", "OCA", "CT", "CTA", "CTI", "OPV", "OPVI", "OPVA"]

# Define connection string
connection_string = os.environ.get("DB_URL", "")

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

test_database_connection(engine, Flight)
