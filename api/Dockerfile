FROM python:3.12.7-alpine3.20

WORKDIR /app


COPY Pipfile Pipfile.lock ./

RUN pip install pipenv
RUN pipenv requirements > requirements.txt
RUN pip install -r requirements.txt

COPY . ./ 

EXPOSE 5051
# CMD ["gunicorn", "-b", ":5051", "app:app"]
CMD ["python", "wsgi.py"]