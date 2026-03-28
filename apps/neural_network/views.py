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
<<<<<<< HEAD
    gigachain = prompt | model
    gigachain.invoke({})
=======
    chain = prompt | model
>>>>>>> 8c5ccfda3cdc59e9c438a777dd64f5cf5c17b588

def ai_filter(request):
    pass
