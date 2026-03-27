from django.shortcuts import render
import os
from dotenv import load_dotenv
from langchain_gigachat import GigaChat
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
api_key = os.getenv('API_KEY')
model = GigaChat(
    credentials = api_key,
    model = "GigaChat-2",
    verify_ssl_certs = False,
    )

def ai_analysis(request):
    with open('sys_prompt_analysis.txt') as sys_prompt:
        prompt = ChatPromptTemplate.from_template(f"{sys_prompt}")
    chain = prompt | model

def ai_filter(request):
    pass
