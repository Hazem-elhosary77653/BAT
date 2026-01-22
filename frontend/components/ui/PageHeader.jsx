import React from 'react';

const PageHeader = ({
    icon: Icon,
    title,
    description,
    actions,
    iconClassName = "text-white",
    iconBgClassName = "bg-primary"
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    {Icon && (
                        <div className={`p-2 ${iconBgClassName} rounded-lg shadow-sm flex-shrink-0`}>
                            <Icon size={24} className={iconClassName} />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] tracking-tight">
                        {title}
                    </h1>
                </div>
                {description && (
                    <p className="text-[var(--color-text-muted)] text-base ml-0 md:ml-11">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 md:self-end">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
