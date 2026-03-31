from django.shortcuts import render
import os
from dotenv import load_dotenv
from langchain_gigachat import GigaChat
from langchain_core.messages import HumanMessage, SystemMessage
from apps.portfolio.models import Achievement

load_dotenv()
api_key = os.getenv('API_KEY')
model = GigaChat(
    credentials = api_key,
    model = "GigaChat-2",
    verify_ssl_certs = False,
    )

def ai_analysis(request):
    with open("apps/neural_network/sys_prompt_analysis.txt") as sys_prompt:
        messages = [
            SystemMessage(content=sys_prompt.read()),
            HumanMessage(content="")
        ]
    response = model.invoke(messages)

def ai_filter(request):
    pass
