import React from 'react';

const PageHeader = ({ title, description, icon: Icon, actions }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3 mb-1.5">
                    {Icon && (
                        <div className="p-2 bg-[var(--color-primary)] rounded-lg shadow-sm shadow-[var(--color-primary)]/20">
                            <Icon size={20} className="text-white" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{title}</h1>
                </div>
                {description && (
                    <p className="text-sm text-[var(--color-text-muted)] font-medium ml-11 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
