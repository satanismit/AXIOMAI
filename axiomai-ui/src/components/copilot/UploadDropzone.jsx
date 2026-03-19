import React, { useState, useRef } from 'react';

const UploadDropzone = ({ onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            await uploadFile(files[0]);
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        if (file.type !== 'application/pdf') {
            setError("Must be a PDF file.");
            return;
        }
        setIsUploading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Assuming default FastAPI port for backend requests
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) throw new Error("Upload failed. Is backend running?");
            
            await response.json();
            onUploadSuccess({ name: file.name, status: 'Indexed' });
        } catch (err) {
            setError(err.message || 'Failed to upload paper');
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div 
            className={`glass-panel ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
                padding: '3rem',
                textAlign: 'center',
                border: isDragging ? '1px solid var(--color-trust)' : '1px dashed var(--text-muted)',
                backgroundColor: isDragging ? 'var(--color-trust-dim)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}
        >
            <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                onChange={handleChange} 
                style={{ display: 'none' }} 
            />
            
            <div style={{ marginBottom: '1rem', color: isDragging ? 'var(--color-trust)' : 'var(--color-intelligence)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
            </div>
            
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isUploading ? "INGESTING PAPER..." : "DRAG & DROP RESEARCH PAPER"}
            </h3>
            
            <p className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {isUploading ? "Vectorizing chunks and building semantic index" : "or click to browse local files (.pdf only)"}
            </p>
            
            {error && (
                <div style={{ color: 'var(--status-risk)', marginTop: '1rem' }} className="mono">
                    [ERROR]: {error}
                </div>
            )}
        </div>
    );
};

export default UploadDropzone;
