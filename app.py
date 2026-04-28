import streamlit as st
import pandas as pd
from agents.data_agent import load_data, preprocess_data
from agents.model_agent import train_model
from agents.fairness_agent import compute_fairness_metrics, classify_risk
from agents.llm_agent import generate_bias_explanation, generate_mitigation_recommendations
from agents.report_agent import generate_audit_report
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

st.set_page_config(page_title="BiasGuard", layout="wide", initial_sidebar_state="expanded")

# Custom CSS for a professional look
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        background: -webkit-linear-gradient(45deg, #4A90E2, #50E3C2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0px;
        padding-bottom: 10px;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #6c757d;
        margin-bottom: 2rem;
    }
    </style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">BiasGuard: AI Equity Auditor</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Upload your dataset to dynamically detect bias, compute fairness metrics, and receive actionable, AI-driven mitigation strategies.</div>', unsafe_allow_html=True)

# Sidebar for configuration
with st.sidebar:
    st.header("Data Source")
    uploaded_file = st.file_uploader("Upload Dataset (CSV)", type=["csv"])
    
    st.markdown("---")
    st.info("The application automatically loads your API key from the `.env` file.")

if uploaded_file is not None:
    # 1. Ingestion
    df = load_data(uploaded_file)
    
    with st.expander("🔍 View Dataset Preview", expanded=False):
        st.dataframe(df.head(10), use_container_width=True)
    
    st.markdown("### Model Configuration")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # Try to default to a binary column (like Loan_Status) if one exists
        binary_cols = [c for c in df.columns if len(df[c].dropna().unique()) == 2]
        default_target_idx = list(df.columns).index(binary_cols[-1]) if binary_cols else 0
        target_col = st.selectbox("Target Prediction Column", df.columns, index=default_target_idx)
    
    with col2:
        # Exclude target from sensitive options
        sensitive_options = [c for c in df.columns if c != target_col]
        sensitive_col = st.selectbox("Sensitive Attribute", sensitive_options)
        
    with col3:
        model_type = st.selectbox("Classification Model", ["Logistic Regression", "Decision Tree"])
        
    st.markdown("---")
    
    if st.button("🚀 Run Fairness Audit", use_container_width=True):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            st.error("Please ensure your `GEMINI_API_KEY` is set correctly in the `.env` file.")
        elif len(df[target_col].dropna().unique()) != 2:
            st.error(f"**Invalid Target Column:** The selected target '{target_col}' has {len(df[target_col].dropna().unique())} unique values. The fairness audit requires a binary target (exactly 2 possible outcomes, e.g., 'Yes'/'No' or 'Approved'/'Denied'). Please select a different Target Prediction Column.")
        else:
            # Create a dynamic progress UI
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            status_text.text("Processing dataset and handling missing values...")
            df_processed = preprocess_data(df, target_col=target_col)
            progress_bar.progress(25)
                
            status_text.text(f"Training {model_type} model...")
            model, features, X_test, y_test, accuracy = train_model(
                df_processed, 
                target_col=target_col, 
                model_type=model_type
            )
            y_pred = model.predict(X_test)
            sensitive_features_test = X_test[sensitive_col]
            progress_bar.progress(50)

            status_text.text("Evaluating fairness metrics...")
            metrics = compute_fairness_metrics(y_test, y_pred, sensitive_features_test)
            risk_level = classify_risk(metrics)
            progress_bar.progress(75)
                
            status_text.text("Generating AI insights and mitigations...")
            explanation = generate_bias_explanation(metrics, risk_level, target_col, sensitive_col)
            mitigation = generate_mitigation_recommendations(metrics, risk_level, target_col, sensitive_col)
            progress_bar.progress(100)
            status_text.text("Audit Complete!")

            # Dashboard Display
            st.markdown("---")
            st.header("📊 Audit Results Dashboard")
            
            # Key Metrics
            m1, m2, m3 = st.columns(3)
            m1.metric("Model Accuracy", f"{accuracy:.2%}")
            
            risk_color = "🟢" if risk_level == "Low Risk" else "🟡" if risk_level == "Medium Risk" else "🔴"
            m2.metric("Overall Bias Risk", f"{risk_color} {risk_level}")
            
            m3.metric("Evaluated Attribute", sensitive_col)
            
            # Tabs for detailed insights
            tab1, tab2, tab3 = st.tabs(["📈 Fairness Metrics", "🧠 AI Explanation", "💡 Mitigation Strategies"])
            
            with tab1:
                st.subheader("Statistical Fairness Breakdown")
                f1, f2 = st.columns(2)
                f1.metric("Demographic Parity Difference", f"{metrics['demographic_parity_difference']:.4f}")
                f2.metric("Equal Opportunity Difference", f"{metrics['equal_opportunity_difference']:.4f}")
                st.caption("*Values closer to 0 indicate higher fairness.*")
            
            with tab2:
                st.subheader("Plain Language Insights")
                st.info(explanation)
            
            with tab3:
                st.subheader("Recommended Actions")
                st.warning(mitigation)
            
            # 6. Report Generation
            report_md = generate_audit_report(
                dataset_name=uploaded_file.name,
                df_shape=df.shape,
                target_col=target_col,
                sensitive_col=sensitive_col,
                model_type=model_type,
                accuracy=accuracy,
                metrics=metrics,
                risk_level=risk_level,
                explanation=explanation,
                mitigation=mitigation
            )
            
            st.markdown("---")
            st.download_button(
                label="📥 Download Comprehensive Audit Report",
                data=report_md,
                file_name="fairness_audit_report.md",
                mime="text/markdown",
                use_container_width=True
            )
else:
    st.info("Upload a CSV dataset from the sidebar to initialize the dashboard.")
