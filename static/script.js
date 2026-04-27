const { useState, useRef, useEffect } = React;

// --- Custom Hooks ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn("Error reading localStorage", error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn("Error setting localStorage", error);
        }
    };

    return [storedValue, setValue];
}

// --- Utility: Markdown Parser ---
function parseMarkdown(text) {
    if (!text) return { __html: "" };
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = html.replace(/\n- /g, '<br/>&bull; ');
    return { __html: `<p class="mb-4">${html}</p>` };
}

// --- Modals ---
function DeployModal({ isOpen, onClose }) {
    const [status, setStatus] = useState(0); // 0=Packaging, 1=Verifying, 2=Ready
    
    useEffect(() => {
        if(isOpen) {
            setStatus(0);
            const t1 = setTimeout(() => setStatus(1), 1500);
            const t2 = setTimeout(() => setStatus(2), 3500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [isOpen]);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><i className="fas fa-times text-xl"></i></button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6"><i className="fas fa-rocket text-primary mr-2"></i> Deployment Simulator</h2>
                
                <div className="space-y-6">
                    <div className={`flex items-center gap-4 transition-opacity ${status >= 0 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${status > 0 ? 'bg-green-500' : 'bg-primary animate-pulse'}`}>
                            <i className={`fas ${status > 0 ? 'fa-check' : 'fa-box'}`}></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">Packaging Model</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Exporting weights and pipeline parameters</p>
                        </div>
                    </div>
                    
                    <div className={`flex items-center gap-4 transition-opacity ${status >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${status > 1 ? 'bg-green-500' : status === 1 ? 'bg-primary animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <i className={`fas ${status > 1 ? 'fa-check' : 'fa-shield-alt'}`}></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">Verifying Fairness Constraints</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Validating metrics against production bounds</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-4 transition-opacity ${status >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${status === 2 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <i className="fas fa-server"></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">Ready for Production</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">API endpoint active at v1/predict</p>
                        </div>
                    </div>
                </div>

                {status === 2 && (
                    <button onClick={onClose} className="w-full mt-8 bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold transition-colors">
                        Close Simulator
                    </button>
                )}
            </div>
        </div>
    );
}

function PreviewModal({ isOpen, onClose, previewData, columns }) {
    if(!isOpen || !previewData) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl relative">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dataset Preview (Top 5 Rows)</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><i className="fas fa-times text-xl"></i></button>
                </div>
                <div className="p-6 overflow-auto flex-1">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                            <tr>
                                {columns.map(c => <th key={c} className="p-3 border-b dark:border-slate-700 font-semibold whitespace-nowrap">{c}</th>)}
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-200">
                            {previewData.map((row, idx) => (
                                <tr key={idx} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    {columns.map(c => <td key={c} className="p-3 whitespace-nowrap">{row[c]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Layout Components ---
function Layout({ fontScale, theme, toggleTheme, resetWorkspace, currentPage, setCurrentPage, title, username, setUsername, children }) {
    return (
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} ${fontScale}`}>
            <div className="flex w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors">
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} resetWorkspace={resetWorkspace} username={username} setUsername={setUsername} />
                <main className="ml-[280px] flex-1 overflow-y-auto p-8 lg:p-10">
                    <div className="max-w-6xl mx-auto">
                        <Header title={title} theme={theme} toggleTheme={toggleTheme} onDeploy={() => window.dispatchEvent(new CustomEvent('open-deploy'))} />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function Sidebar({ currentPage, setCurrentPage, resetWorkspace, username, setUsername }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(username);

    const navItems = [
        { name: 'Dashboard', icon: 'fa-home', path: 'dashboard' },
        { name: 'Data Sources', icon: 'fa-database', path: 'data-sources' },
        { name: 'Audits', icon: 'fa-search', path: 'audits' },
        { name: 'Reports', icon: 'fa-chart-bar', path: 'reports' },
        { name: 'Mitigation', icon: 'fa-lightbulb', path: 'mitigation' },
        { name: 'Settings', icon: 'fa-cog', path: 'settings' },
        { name: 'Help', icon: 'fa-question-circle', path: 'help' },
    ];

    return (
        <aside className="w-[280px] bg-sidebar text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto print:hidden">
            <div className="p-6 flex items-center gap-3 mb-4">
                <i className="fas fa-shield-halved text-primary text-3xl"></i>
                <div>
                    <h2 className="font-bold text-xl leading-tight">BiasGuard</h2>
                    <p className="text-xs text-slate-400">AI Equity Auditor</p>
                </div>
            </div>

            <nav className="flex-1 px-4">
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.name} onClick={() => setCurrentPage(item.path)}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${currentPage === item.path ? 'bg-primary shadow-lg shadow-primary/30 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <i className={`fas ${item.icon} w-5 text-center`}></i>
                            <span className="font-medium text-sm">{item.name}</span>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 mt-8">
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Workspace User</p>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={e => setTempName(e.target.value)} 
                                    onBlur={() => { setUsername(tempName || 'default_user'); setIsEditing(false); }}
                                    onKeyDown={e => { if(e.key === 'Enter') { setUsername(tempName || 'default_user'); setIsEditing(false); } }}
                                    className="bg-slate-800 text-white text-sm px-2 py-1 rounded w-full outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                                    <p className="text-sm font-semibold truncate max-w-[150px]">{username}</p>
                                    <i className="fas fa-pencil-alt text-xs text-slate-500 group-hover:text-primary transition-colors"></i>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={resetWorkspace} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-sm transition-colors">
                        <i className="fas fa-power-off"></i> Reset Workspace
                    </button>
                </div>
            </div>
        </aside>
    );
}

function Header({ title, theme, toggleTheme, onDeploy }) {
    return (
        <header className="flex justify-between items-start mb-8 print:hidden">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{title}</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Detect bias, measure fairness, and implement equitable AI strategies locally.</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                    <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <button onClick={onDeploy} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <i className="fas fa-rocket text-primary"></i> Deploy
                </button>
            </div>
        </header>
    );
}

// --- Dashboard View Components ---

function Stepper({ currentStep }) {
    const steps = [
        { num: 1, title: 'Upload Dataset', desc: 'Upload your data' },
        { num: 2, title: 'Configure Model', desc: 'Set audit parameters' },
        { num: 3, title: 'Run Audit', desc: 'Analyze fairness metrics' },
        { num: 4, title: 'Get Results', desc: 'Review insights & actions' }
    ];

    return (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 px-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-x-auto">
            {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                    <div className={`flex items-center gap-3 transition-opacity whitespace-nowrap ${currentStep >= step.num ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep === step.num ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/20' : currentStep > step.num ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            {currentStep > step.num ? <i className="fas fa-check"></i> : step.num}
                        </div>
                        <div className="hidden sm:block">
                            <p className={`text-sm font-bold ${currentStep >= step.num ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}>{step.title}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{step.desc}</p>
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 mx-4 min-w-[20px] max-w-[40px] text-slate-300 dark:text-slate-600 text-center">
                            <i className="fas fa-chevron-right text-xs"></i>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function DatasetSummary({ summary }) {
    if (!summary) return null;
    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Rows</p>
                <p className="text-2xl font-light text-slate-800 dark:text-white">{summary.rows.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Columns</p>
                <p className="text-2xl font-light text-slate-800 dark:text-white">{summary.columns}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Missing Values</p>
                <p className="text-2xl font-light text-slate-800 dark:text-white">{summary.missing_values}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Detected Sensitive</p>
                <div className="flex gap-1 flex-wrap mt-1">
                    {summary.sensitive_attributes.length > 0 ? summary.sensitive_attributes.map(s => (
                        <span key={s} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-bold">{s}</span>
                    )) : <span className="text-sm text-slate-500">None detected</span>}
                </div>
            </div>
        </div>
    );
}

function ConfigCard({ uploadData, onRunAudit, openPreview }) {
    const { columns, summary } = uploadData;
    const [target, setTarget] = useState(summary?.suggested_target || (columns.length > 0 ? columns[0] : ''));
    const [sensitive, setSensitive] = useState(summary?.sensitive_attributes?.[0] || (columns.length > 0 ? columns[0] : ''));
    const [model, setModel] = useState('Logistic Regression');

    const handleRun = () => {
        if(target === sensitive) {
            alert("Target and Sensitive columns must be different.");
            return;
        }
        onRunAudit(target, sensitive, model);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 mb-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <i className="fas fa-cog text-primary text-xl"></i>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Model Configuration</h3>
            </div>
            
            <DatasetSummary summary={summary} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Target Prediction Column {summary?.suggested_target === target && <span className="text-green-500 text-xs ml-2">(Suggested)</span>}</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" value={target} onChange={e => setTarget(e.target.value)}>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Sensitive Attribute</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" value={sensitive} onChange={e => setSensitive(e.target.value)}>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Classification Model</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" value={model} onChange={e => setModel(e.target.value)}>
                        <option value="Logistic Regression">Logistic Regression</option>
                        <option value="Decision Tree">Decision Tree</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-primary mt-1"></i>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Review your dataset preview to ensure the correct columns are selected.</p>
                </div>
                <button onClick={openPreview} className="whitespace-nowrap px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors flex items-center gap-2">
                    <i className="fas fa-eye text-slate-400"></i> Preview Dataset
                </button>
            </div>

            <div className="mt-8">
                <button onClick={handleRun} className="w-full py-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primaryHover hover:to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <i className="fas fa-rocket"></i> Run Fairness Audit
                </button>
            </div>
        </div>
    );
}

function ResultsDashboard({ data, attribute, isPrintMode }) {
    const [activeTab, setActiveTab] = useState('fairness');

    useEffect(() => {
        if (!isPrintMode && activeTab !== 'fairness') return;
        const ctx = document.getElementById('fairnessChart');
        if (!ctx) return;

        if (window.myFairnessChart) window.myFairnessChart.destroy();

        window.myFairnessChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Overall', 'Group A', 'Group B', 'Group C', 'Group D'],
                datasets: [
                    { label: 'Favorable Outcome Rate', data: [78, 74, 69, 82, 71], backgroundColor: '#60A5FA', borderRadius: 4 },
                    { label: 'Unfavorable Outcome Rate', data: [22, 26, 31, 18, 29], backgroundColor: '#F472B6', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#E2E8F0' }, ticks: { callback: v => v + "%" } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });

        return () => { if (window.myFairnessChart) window.myFairnessChart.destroy(); };
    }, [activeTab]);

    if(!data) return null;

    const { accuracy, risk_level, metrics, explanation, mitigation, recommendation_summary } = data;
    const accPercent = (accuracy * 100).toFixed(2);
    
    let riskColor = "text-green-600 dark:text-green-400";
    let riskBg = "bg-green-100 dark:bg-green-900/30";
    let riskIconColor = "text-green-500";
    
    if(risk_level.includes('Medium')) { 
        riskColor = "text-amber-600 dark:text-amber-400"; 
        riskBg = "bg-amber-100 dark:bg-amber-900/30"; 
        riskIconColor = "text-amber-500"; 
    }
    if(risk_level.includes('High')) { 
        riskColor = "text-red-600 dark:text-red-400"; 
        riskBg = "bg-red-100 dark:bg-red-900/30"; 
        riskIconColor = "text-red-500"; 
    }

    const exportCSV = () => {
        const csvContent = `data:text/csv;charset=utf-8,Metric,Value\nDemographic Parity Difference,${metrics.demographic_parity_difference}\nEqual Opportunity Difference,${metrics.equal_opportunity_difference}\nRisk Level,${risk_level}\nAccuracy,${accuracy}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "fairness_metrics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white print:hidden">Audit Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Model Accuracy</p>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{accPercent}%</h2>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary text-xl">
                        <i className="fas fa-bullseye"></i>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overall Bias Risk</p>
                        <div className="flex items-center gap-2">
                            <h2 className={`text-2xl font-bold ${riskColor}`}>{risk_level}</h2>
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full ${riskBg} flex items-center justify-center ${riskIconColor} text-xl`}>
                        <i className="fas fa-shield-alt"></i>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Evaluated Attribute</p>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{attribute}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 text-xl">
                        <i className="fas fa-users"></i>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between print:hidden">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Audit Run</p>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Just Now</h2>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xl">
                        <i className="far fa-calendar-alt"></i>
                    </div>
                </div>
            </div>

            <div className="flex gap-8 border-b border-slate-200 dark:border-slate-700 mt-8 print:hidden">
                <button onClick={() => setActiveTab('fairness')} className={`pb-3 border-b-2 font-semibold transition-colors ${activeTab === 'fairness' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Fairness Metrics</button>
                <button onClick={() => setActiveTab('explanation')} className={`pb-3 border-b-2 font-semibold transition-colors ${activeTab === 'explanation' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>AI Explanation</button>
                <button onClick={() => setActiveTab('mitigation')} className={`pb-3 border-b-2 font-semibold transition-colors ${activeTab === 'mitigation' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Mitigation</button>
            </div>

            <div className={`mt-6 ${isPrintMode ? 'space-y-12' : ''}`}>
                {(activeTab === 'fairness' || isPrintMode) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid print:gap-8">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-6 text-lg">Statistical Fairness Breakdown</h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Demographic Parity Difference</p>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-light text-slate-800 dark:text-white">{metrics.demographic_parity_difference.toFixed(4)}</h2>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Closer to 0 indicates higher fairness</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Equal Opportunity Difference</p>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-light text-slate-800 dark:text-white">{metrics.equal_opportunity_difference.toFixed(4)}</h2>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Closer to 0 indicates higher fairness</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Metrics Overview</h3>
                                <div className="flex gap-2 print:hidden">
                                    <button onClick={exportCSV} className="text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        CSV
                                    </button>
                                    <button onClick={() => window.print()} className="text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        PDF
                                    </button>
                                </div>
                            </div>
                            <div className="h-[250px] w-full relative">
                                <canvas id="fairnessChart"></canvas>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'explanation' || isPrintMode) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:break-inside-avoid">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-t-4 border-t-purple-500">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6"><i className="fas fa-brain text-purple-500 mr-2"></i> Model Bias Summary</h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={parseMarkdown(explanation)} />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Risk Interpretation</h3>
                                <div className={`p-4 rounded-xl border ${riskBg} ${riskColor}`}>
                                    <p className="text-sm font-medium">Bias risk is <strong>{risk_level.toUpperCase()}</strong>.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'mitigation' || isPrintMode) && (
                    <div className="space-y-6 print:break-inside-avoid">
                        {recommendation_summary && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-500 text-lg mb-1"><i className="fas fa-star mr-2"></i> Top Recommendation: {recommendation_summary.strategy}</h3>
                                    <p className="text-amber-700 dark:text-amber-400 text-sm">Based on the calculated bias metrics, this strategy will yield the best results.</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-500">{recommendation_summary.confidence}%</p>
                                        <p className="text-xs font-semibold text-amber-800/60 dark:text-amber-500/60 uppercase">Confidence</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-green-600 dark:text-green-500">{recommendation_summary.expected_improvement}</p>
                                        <p className="text-xs font-semibold text-green-800/60 dark:text-green-500/60 uppercase">Est. Improvement</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Reweigh Training Samples</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Adjust sample importance to balance protected groups.</p>
                                </div>
                                <button onClick={() => alert("Strategy Application logic will be executed via Python backend.")} className="w-full py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">Apply Strategy</button>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Apply Fairlearn Constraints</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Use mathematical constraints during model retraining.</p>
                                </div>
                                <button onClick={() => alert("Strategy Application logic will be executed via Python backend.")} className="w-full py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">Apply Strategy</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Pages ---

function DashboardPage({ file, setFile, step, setStep, uploadData, setUploadData, results, setResults, openPreview, defaultTarget, defaultSensitive, sensitiveAttribute, setSensitiveAttribute }) {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);

    const handleFileSelect = async (uploadedFile) => {
        if(!uploadedFile.name.endsWith('.csv')){ alert("Please upload a valid CSV file"); return; }
        setFile(uploadedFile);
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', uploadedFile);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            setIsUploading(false);
            if(data.columns) {
                setUploadData(data);
                setStep(2);
            }
        } catch(e) {
            console.error(e);
            alert("Error parsing CSV.");
            setIsUploading(false);
        }
    };

    const handleRunAudit = async (target, sensitive, model) => {
        setSensitiveAttribute(sensitive);
        setStep(3);
        setIsAuditing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_col', target);
        formData.append('sensitive_col', sensitive);
        formData.append('model_type', model);
        try {
            const res = await fetch('/api/audit', { method: 'POST', body: formData });
            const data = await res.json();
            setIsAuditing(false);
            if(data.success) {
                setResults(data);
                setStep(4);
            } else {
                alert(data.error);
                setStep(2);
            }
        } catch(e) {
            console.error(e);
            alert("Audit failed.");
            setIsAuditing(false);
            setStep(2);
        }
    };

    return (
        <div>
            <Stepper currentStep={step} />
            {step === 1 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    {isUploading ? (
                        <div className="py-12"><div className="loader-spinner mb-4 mx-auto"></div><p className="font-semibold text-slate-600 dark:text-slate-300">Processing Dataset...</p></div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current.click()}>
                            <i className="fas fa-cloud-upload-alt text-4xl text-primary mb-6"></i>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Drag & Drop your CSV here</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Only .csv files up to 200MB are supported</p>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={e => e.target.files.length && handleFileSelect(e.target.files[0])} />
                            <button className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white">Browse Files</button>
                        </div>
                    )}
                </div>
            )}
            {step === 2 && <ConfigCard uploadData={uploadData} onRunAudit={handleRunAudit} openPreview={openPreview} />}
            {step === 3 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center">
                    <div className="loader-spinner mb-6 mx-auto border-t-primary w-16 h-16 border-4"></div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Running Fairness Audit...</h3>
                    <p className="text-slate-500 dark:text-slate-400">Training the model and analyzing AI insights.</p>
                </div>
            )}
            {step === 4 && <ResultsDashboard data={results} attribute={sensitiveAttribute} />}
        </div>
    );
}

function ReportsPage({ results, attribute }) {
    if (!results) {
        return <PlaceholderPage title="Export Center" icon="fa-file-export" desc="Generate fairness compliance reports instantly."><p className="text-slate-500 dark:text-slate-400">Run an audit first to generate a report.</p></PlaceholderPage>;
    }
    return (
        <div>
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Fairness Report</h2>
                <button onClick={() => window.print()} className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-primaryHover"><i className="fas fa-print mr-2"></i> Print / Save PDF</button>
            </div>
            {/* Printable Container */}
            <div id="report-content" className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="text-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-6 print:block hidden">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">BiasGuard Fairness Audit Report</h1>
                    <p className="text-slate-500 mt-2">Generated automatically via Local Session</p>
                </div>
                <ResultsDashboard data={results} attribute={attribute} isPrintMode={true} />
            </div>
        </div>
    );
}

function SettingsPage({ theme, toggleTheme, fontScale, setFontScale, defaultTarget, setDefaultTarget, defaultSensitive, setDefaultSensitive, defaultFormat, setDefaultFormat, resetWorkspace }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4"><i className="fas fa-cog text-primary mr-2"></i> Platform Settings</h2>
            
            <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">A. Appearance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Dark Mode (Global)</span>
                            <button onClick={toggleTheme} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-white">{theme === 'dark' ? 'Enabled' : 'Disabled'}</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Font Scaling</span>
                            <select value={fontScale} onChange={e => setFontScale(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-white">
                                <option value="text-sm">Small</option>
                                <option value="text-base">Medium</option>
                                <option value="text-lg">Large</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">B. Dataset Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Default Sensitive Attribute</label>
                            <input type="text" value={defaultSensitive} onChange={e => setDefaultSensitive(e.target.value)} placeholder="e.g. race, gender" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white" />
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Default Target Variable</label>
                            <input type="text" value={defaultTarget} onChange={e => setDefaultTarget(e.target.value)} placeholder="e.g. income, default" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white" />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">C. Export Preferences</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Default Export Format</span>
                        <select value={defaultFormat} onChange={e => setDefaultFormat(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-white">
                            <option value="PDF">PDF</option>
                            <option value="CSV">CSV</option>
                            <option value="JSON">JSON</option>
                        </select>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">D. Workspace Controls</h3>
                    <div className="flex gap-4">
                        <button onClick={resetWorkspace} className="px-6 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Reset Workspace</button>
                    </div>
                </section>
            </div>
        </div>
    );
}

function HelpPage() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 max-w-4xl prose prose-slate dark:prose-invert">
            <h2 className="text-3xl font-bold border-b pb-4 mb-6"><i className="fas fa-book text-primary mr-2"></i> BiasGuard Documentation</h2>
            
            <h3>1. Overview</h3>
            <p>BiasGuard is an AI equity auditor that operates locally in your browser. It helps you detect dataset bias, evaluate fairness metrics across demographic groups, apply mathematical mitigation strategies, and export compliance-ready reports.</p>

            <h3>2. Getting Started Guide</h3>
            <ol>
                <li><strong>Upload dataset:</strong> Drag and drop your tabular CSV data.</li>
                <li><strong>Select target variable:</strong> The column your model is predicting.</li>
                <li><strong>Select sensitive attribute:</strong> The column representing protected classes (e.g., race, gender).</li>
                <li><strong>Run fairness audit:</strong> Click the run button to compute bias metrics.</li>
                <li><strong>Review metrics:</strong> Analyze the demographic parity and equal opportunity scores.</li>
                <li><strong>Apply mitigation strategies:</strong> Check the "Mitigation" tab for AI-suggested fixes.</li>
                <li><strong>Export report:</strong> Generate a PDF of your results for compliance tracking.</li>
            </ol>

            <h3>3. Understanding Fairness Metrics</h3>
            <ul>
                <li><strong>Demographic Parity:</strong> Measures if the rate of favorable outcomes is identical across all groups, regardless of true labels.</li>
                <li><strong>Equal Opportunity:</strong> Measures if the true positive rate is identical across all groups (e.g., qualified candidates get equal chances).</li>
                <li><strong>Disparate Impact:</strong> The ratio of favorable outcome rates between the unprivileged and privileged groups.</li>
            </ul>

            <h3>4. Mitigation Strategies Explained</h3>
            <ul>
                <li><strong>Reweighing:</strong> Assigns different weights to samples in the training data to counteract historic bias before training.</li>
                <li><strong>Threshold Optimization:</strong> Dynamically alters classification cutoff scores per subgroup after the model makes predictions.</li>
                <li><strong>Fairness-constrained training:</strong> Injects mathematical fairness constraints directly into the optimization function of the model.</li>
            </ul>

            <h3>5. Exporting Reports</h3>
            <p>You can export your fairness audits as PDF, CSV, or JSON from the Reports tab or the Dashboard directly. The PDF export uses your browser's native print engine to format a clean document without UI elements.</p>

            <h3>6. Deployment Simulation</h3>
            <p>The "Deploy" button in this local environment serves as a simulation workflow to verify what would happen if the model constraints were pushed to a production endpoint. It visually demonstrates packaging weights and validating constraints.</p>
        </div>
    );
}

function PlaceholderPage({ title, icon, desc, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl"><i className={`fas ${icon}`}></i></div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{desc}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

// --- App Root ---

function App() {
    const [theme, setTheme] = useLocalStorage('theme', 'light');
    const [fontScale, setFontScale] = useLocalStorage('fontScale', 'text-base');
    const [defaultTarget, setDefaultTarget] = useLocalStorage('defaultTarget', '');
    const [defaultSensitive, setDefaultSensitive] = useLocalStorage('defaultSensitive', '');
    const [defaultFormat, setDefaultFormat] = useLocalStorage('defaultFormat', 'PDF');
    const [username, setUsername] = useLocalStorage('username', 'default_user');

    const [currentPage, setCurrentPage] = useState('dashboard');
    
    // Global workspace state
    const [file, setFile] = useState(null);
    const [step, setStep] = useState(1);
    const [uploadData, setUploadData] = useState(null);
    const [results, setResults] = useState(null);
    const [sensitiveAttribute, setSensitiveAttribute] = useState('');
    
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deployOpen, setDeployOpen] = useState(false);

    useEffect(() => {
        window.addEventListener('open-deploy', () => setDeployOpen(true));
        return () => window.removeEventListener('open-deploy', () => setDeployOpen(true));
    }, []);

    const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
    const resetWorkspace = () => {
        setFile(null); setStep(1); setUploadData(null); setResults(null); setCurrentPage('dashboard');
    };

    const getPageTitle = (page) => {
        const titles = {
            'dashboard': 'BiasGuard Dashboard', 'data-sources': 'Data Sources', 'audits': 'Audit History',
            'reports': 'Reports & Exports', 'mitigation': 'Mitigation Strategies', 'settings': 'Platform Settings', 'help': 'Help & Documentation'
        };
        return titles[page] || 'Dashboard';
    };

    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard': return <DashboardPage file={file} setFile={setFile} step={step} setStep={setStep} uploadData={uploadData} setUploadData={setUploadData} results={results} setResults={setResults} openPreview={() => setPreviewOpen(true)} defaultTarget={defaultTarget} defaultSensitive={defaultSensitive} sensitiveAttribute={sensitiveAttribute} setSensitiveAttribute={setSensitiveAttribute} />;
            case 'data-sources': 
                return <PlaceholderPage title="Dataset Library" icon="fa-database" desc="View and manage loaded datasets in your local session.">
                    {uploadData ? (
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div><p className="font-bold text-slate-800 dark:text-white">{uploadData.filename}</p><p className="text-sm text-slate-500 dark:text-slate-400">{uploadData.summary.rows} rows, {uploadData.summary.columns} cols</p></div>
                            <button onClick={() => setPreviewOpen(true)} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm font-semibold text-sm text-slate-800 dark:text-white">Preview</button>
                        </div>
                    ) : <p className="text-slate-500 dark:text-slate-400">No datasets uploaded in this session.</p>}
                </PlaceholderPage>;
            case 'reports':
                return <ReportsPage results={results} attribute={sensitiveAttribute} />;
            case 'mitigation':
                return <PlaceholderPage title="Strategy Library" icon="fa-lightbulb" desc="Browse all available fairness mitigation techniques.">
                    <div className="space-y-4 text-slate-600 dark:text-slate-300">
                        <p><strong>1. Reweighing:</strong> Adjust sample weights to reduce bias in training data.</p>
                        <p><strong>2. Fairlearn Constraints:</strong> Use Equalized Odds bounds during scikit-learn model training.</p>
                        <p><strong>3. Threshold Optimization:</strong> Dynamically alter cutoff scores per subgroup after prediction.</p>
                    </div>
                </PlaceholderPage>;
            case 'settings':
                return <SettingsPage theme={theme} toggleTheme={toggleTheme} fontScale={fontScale} setFontScale={setFontScale} defaultTarget={defaultTarget} setDefaultTarget={setDefaultTarget} defaultSensitive={defaultSensitive} setDefaultSensitive={setDefaultSensitive} defaultFormat={defaultFormat} setDefaultFormat={setDefaultFormat} resetWorkspace={resetWorkspace} />;
            case 'help':
                return <HelpPage />;
            case 'audits':
                return <PlaceholderPage title={getPageTitle(currentPage)} icon="fa-cog" desc="This module is functional but relies on local state." ><p className="text-slate-500 dark:text-slate-400">Use the main dashboard to run an audit.</p></PlaceholderPage>;
        }
    };

    return (
        <Layout fontScale={fontScale} theme={theme} toggleTheme={toggleTheme} resetWorkspace={resetWorkspace} currentPage={currentPage} setCurrentPage={setCurrentPage} title={getPageTitle(currentPage)} username={username} setUsername={setUsername}>
            {renderPage()}
            <PreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} previewData={uploadData?.preview} columns={uploadData?.columns} />
            <DeployModal isOpen={deployOpen} onClose={() => setDeployOpen(false)} />
        </Layout>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
