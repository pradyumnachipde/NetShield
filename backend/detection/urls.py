from django.urls import path
from . import views

urlpatterns = [
    path("",views.detection_home,name="detection-home"),
]