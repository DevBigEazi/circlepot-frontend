import React from 'react'
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text = 'Loading...'
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    }

    return (
        <div className="flex items-center justify-center gap-2">
            <div className={`${sizeClasses[size]} animate-spin`}>
                <AiOutlineLoading3Quarters size={sizeClasses[size]} />
            </div>
            {text && <span className="text-sm text-text-light">{text}</span>}
        </div>
    )
}

export default LoadingSpinner
