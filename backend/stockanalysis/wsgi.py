"""
WSGI config for stockanalysis project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stockanalysis.settings')

application = get_wsgi_application()
