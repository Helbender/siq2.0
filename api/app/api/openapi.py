"""OpenAPI/Swagger configuration for the API."""

OPENAPI_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api-docs",
    "title": "SIQ API Documentation",
    "version": "1.0.0",
    "description": "API documentation for SIQ (Sistema de Informação de Quadros) - Flight and Crew Management System",
    "termsOfService": "",
    "contact": {
        "name": "API Support",
    },
    "license": {
        "name": "MIT",
    },
    "tags": [
        {
            "name": "Authentication",
            "description": "Authentication and authorization endpoints",
        },
        {
            "name": "Users",
            "description": "User management endpoints",
        },
        {
            "name": "Flights",
            "description": "Flight management endpoints",
        },
        {
            "name": "Qualifications",
            "description": "Qualification management endpoints",
        },
        {
            "name": "Dashboard",
            "description": "Dashboard and statistics endpoints",
        },
        {
            "name": "Health",
            "description": "Health check endpoints",
        },
    ],
}

