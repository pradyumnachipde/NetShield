from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def analytics_home(request):
    return Response({
        "status": "success",
        "message": "NetShield Analytics API",
        "features": [
            "Traffic Statistics",
            "Classification Charts",
            "Detection History",
        ],
    })