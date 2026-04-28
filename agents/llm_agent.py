import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    """Initialize the LangChain LLM using Google GenAI."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("Please set GEMINI_API_KEY in the .env file.")
    
    # Using gemini-2.5-flash (Supported by your API key)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    return llm

def generate_bias_explanation(metrics: dict, risk_level: str, target_col: str, sensitive_col: str) -> str:
    """
    Generate a simple natural-language bias explanation using LangChain.
    """
    llm = get_llm()
    
    template = """
    You are an AI fairness expert communicating with non-technical users.
    
    The dataset was evaluated for bias predicting '{target_col}' across the sensitive attribute '{sensitive_col}'.
    The calculated fairness metrics are:
    - Demographic Parity Difference: {dpd}
    - Equal Opportunity Difference: {eod}
    
    The overall bias risk level is classified as: {risk_level}.
    
    Please explain these metrics and what they mean for this specific dataset and prediction task in simple, plain natural language. 
    Do not use overly complex mathematical terms. Explain if the model is treating different groups fairly or not.
    """
    
    prompt = PromptTemplate(
        input_variables=["target_col", "sensitive_col", "dpd", "eod", "risk_level"],
        template=template
    )
    
    # Langchain newer versions recommend prompt | llm instead of LLMChain, but LLMChain works or we just use invoke
    chain = prompt | llm
    
    response = chain.invoke({
        "target_col": target_col,
        "sensitive_col": sensitive_col,
        "dpd": round(metrics.get('demographic_parity_difference', 0), 4),
        "eod": round(metrics.get('equal_opportunity_difference', 0), 4),
        "risk_level": risk_level
    })
    
    return response.content

def generate_mitigation_recommendations(metrics: dict, risk_level: str, target_col: str, sensitive_col: str) -> str:
    """
    Generate actionable mitigation recommendations using LangChain.
    """
    llm = get_llm()
    
    template = """
    You are an AI fairness expert advising a data science team.
    
    The dataset was evaluated for bias predicting '{target_col}' across the sensitive attribute '{sensitive_col}'.
    The overall bias risk level is classified as: {risk_level}.
    The metrics:
    - Demographic Parity Difference: {dpd}
    - Equal Opportunity Difference: {eod}
    
    Provide actionable mitigation recommendations to reduce bias. Suggestions can include:
    - Removing sensitive attributes
    - Rebalancing datasets (e.g., SMOTE, resampling)
    - Reweighting samples
    - Using fairness-aware machine learning models
    
    Format the recommendations as clear bullet points.
    """
    
    prompt = PromptTemplate(
        input_variables=["target_col", "sensitive_col", "dpd", "eod", "risk_level"],
        template=template
    )
    
    chain = prompt | llm
    
    response = chain.invoke({
        "target_col": target_col,
        "sensitive_col": sensitive_col,
        "dpd": round(metrics.get('demographic_parity_difference', 0), 4),
        "eod": round(metrics.get('equal_opportunity_difference', 0), 4),
        "risk_level": risk_level
    })
    
    return response.content
