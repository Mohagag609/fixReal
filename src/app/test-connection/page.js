'use client';

import { useState } from 'react';

export default function TestConnection() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setResult(null);
        
        try {
            const response = await fetch('/api/test-connection');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    اختبار الاتصال بقاعدة البيانات
                </h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <button
                        onClick={testConnection}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                    >
                        {loading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                    </button>
                </div>

                {result && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">نتيجة الاختبار:</h2>
                        
                        {result.success ? (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                <h3 className="font-bold">✅ نجح الاتصال!</h3>
                                <p className="mt-2">الرسالة: {result.message}</p>
                                <div className="mt-4">
                                    <p><strong>عدد الجداول:</strong> {result.data.tables}</p>
                                    <p><strong>البيئة:</strong> {result.data.environment}</p>
                                    <p><strong>المتغير المستخدم:</strong> {result.data.databaseUrl}</p>
                                    <p><strong>الوقت:</strong> {new Date(result.data.timestamp).toLocaleString('en-GB')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                <h3 className="font-bold">❌ فشل الاتصال!</h3>
                                <p className="mt-2">الخطأ: {result.error}</p>
                                <div className="mt-4">
                                    <p><strong>البيئة:</strong> {result.details?.environment}</p>
                                    <p><strong>DATABASE_URL موجود:</strong> {result.details?.hasDatabaseUrl ? 'نعم' : 'لا'}</p>
                                    <p><strong>NEON_DATABASE_URL موجود:</strong> {result.details?.hasNeonUrl ? 'نعم' : 'لا'}</p>
                                </div>
                            </div>
                        )}
                        
                        <details className="mt-4">
                            <summary className="cursor-pointer font-semibold">تفاصيل تقنية</summary>
                            <pre className="mt-2 bg-gray-100 p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}