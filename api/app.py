from __future__ import annotations  # noqa: D100, INP001

from app.core.app_factory import create_app

app = create_app()
application = app  # to work with CPANEL PYTHON APPS

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=True)  # noqa: S201
