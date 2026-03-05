'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
    url: string;
    size?: number;
    label?: string;
}

export default function QRCodeDisplay({ url, size = 200, label }: QRCodeDisplayProps) {
    return (
        <div className="qr-container">
            <div className="qr-frame">
                <QRCodeSVG
                    value={url}
                    size={size}
                    bgColor="transparent"
                    fgColor="#ffffff"
                    level="M"
                    includeMargin={false}
                />
            </div>
            {label && <p className="qr-label">{label}</p>}
            <p className="qr-url">{url}</p>
        </div>
    );
}
