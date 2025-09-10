"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [type, setType] = useState<"sqlite"|"postgresql-local"|"postgresql-cloud">("sqlite");
  const [sqliteFile, setSqliteFile] = useState("./data/dev.db");
  const [pgLocalUrl, setPgLocalUrl] = useState("postgresql://postgres:postgres@localhost:5432/estate_db?schema=public");
  const [pgCloudUrl, setPgCloudUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // تحديد نوع قاعدة البيانات من الرابط
  const detectDatabaseType = (url: string) => {
    if (url.startsWith("file:") || url.includes(".db")) {
      return "sqlite";
    } else if (url.includes("postgresql://") || url.includes("postgres://")) {
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        return "postgresql-local";
      } else {
        return "postgresql-cloud";
      }
    }
    return "sqlite";
  };

  // التحقق من التحقق الإداري
  useEffect(() => {
    const adminVerified = localStorage.getItem('adminVerified');
    if (!adminVerified) {
      router.push('/admin-verify');
      return;
    }
  }, [router]);

  // جلب معلومات قاعدة البيانات الحالية
  useEffect(() => {
    const fetchCurrentConfig = async () => {
      try {
        const res = await fetch("/api/setup");
        const data = await res.json();
        if (data.configured) {
          setCurrentConfig(data);
          setType(data.type || "sqlite");
          
          // تحميل الروابط المحفوظة من localStorage
          const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
          if (savedUrls.sqlite) setSqliteFile(savedUrls.sqlite);
          if (savedUrls.pgLocal) setPgLocalUrl(savedUrls.pgLocal);
          if (savedUrls.pgCloud) setPgCloudUrl(savedUrls.pgCloud);
          
          // جلب إحصائيات قاعدة البيانات
          try {
            const statsRes = await fetch("/api/setup/stats");
            if (statsRes.ok) {
              const stats = await statsRes.json();
              if (stats.success) {
                setDbStatus(stats.data);
              }
            }
          } catch (err) {
            console.log("Could not fetch database stats");
          }
        } else {
          // تحميل الروابط المحفوظة حتى لو لم تكن قاعدة البيانات مُعدة
          const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
          if (savedUrls.sqlite) setSqliteFile(savedUrls.sqlite);
          if (savedUrls.pgLocal) setPgLocalUrl(savedUrls.pgLocal);
          if (savedUrls.pgCloud) setPgCloudUrl(savedUrls.pgCloud);
        }
      } catch (err) {
        console.log("No existing configuration found");
        // تحميل الروابط المحفوظة حتى لو فشل جلب الإعداد
        const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
        if (savedUrls.sqlite) setSqliteFile(savedUrls.sqlite);
        if (savedUrls.pgLocal) setPgLocalUrl(savedUrls.pgLocal);
        if (savedUrls.pgCloud) setPgCloudUrl(savedUrls.pgCloud);
      }
    };
    
    fetchCurrentConfig();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // استخدام الرابط المخصص إذا كان موجوداً
      let configData;
      if (customUrl) {
        const detectedType = detectDatabaseType(customUrl);
        if (detectedType === "sqlite") {
          configData = {
            type: "sqlite",
            sqlite: { file: customUrl }
          };
        } else if (detectedType === "postgresql-local") {
          configData = {
            type: "postgresql-local",
            pgLocal: { url: customUrl }
          };
        } else {
          configData = {
            type: "postgresql-cloud",
            pgCloud: { url: customUrl }
          };
        }
      } else {
        configData = {
          type,
          sqlite: { file: sqliteFile },
          pgLocal: { url: pgLocalUrl },
          pgCloud: { url: pgCloudUrl }
        };
      }

      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
      
      const result = await res.json();
      
      if (result.ok) {
        // حفظ الروابط في localStorage
        const urlsToSave = {
          sqlite: sqliteFile,
          pgLocal: pgLocalUrl,
          pgCloud: pgCloudUrl
        };
        localStorage.setItem('savedDatabaseUrls', JSON.stringify(urlsToSave));
        
        setSuccess(true);
        setTimeout(() => {
          router.push("/create-first-user");
        }, 2000);
      } else {
        setError(result.error || "حدث خطأ غير متوقع");
      }
    } catch (err: any) {
      setError(err.message || "فشل في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              إعداد قاعدة البيانات
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              اختر نوع قاعدة البيانات التي تريد استخدامها مع التطبيق
            </p>
          </div>

          {/* Current Database Status */}
          {currentConfig && (
            <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      قاعدة البيانات الحالية
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      النظام متصل بقاعدة البيانات بنجاح
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomUrl(!showCustomUrl)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  {showCustomUrl ? "إخفاء" : "تغيير قاعدة البيانات"}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      currentConfig.type === 'sqlite' ? 'bg-green-500' :
                      currentConfig.type === 'postgresql-local' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentConfig.type === 'sqlite' ? 'SQLite' :
                       currentConfig.type === 'postgresql-local' ? 'PostgreSQL محلي' :
                       'PostgreSQL سحابي'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    نوع قاعدة البيانات
                  </p>
                </div>
                
                {dbStatus && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dbStatus.totalUsers || 0} مستخدم
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      إجمالي المستخدمين
                    </p>
                    {(dbStatus.totalCustomers > 0 || dbStatus.totalUnits > 0) && (
                      <div className="mt-2 text-xs text-gray-500">
                        {dbStatus.totalCustomers > 0 && `${dbStatus.totalCustomers} عميل`}
                        {dbStatus.totalCustomers > 0 && dbStatus.totalUnits > 0 && " • "}
                        {dbStatus.totalUnits > 0 && `${dbStatus.totalUnits} وحدة`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom URL Input */}
              {showCustomUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    إدخال رابط قاعدة بيانات جديد
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => {
                        setCustomUrl(e.target.value);
                        const detectedType = detectDatabaseType(e.target.value);
                        setType(detectedType);
                        
                        // حفظ الرابط المخصص
                        const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
                        if (detectedType === 'sqlite') {
                          savedUrls.sqlite = e.target.value;
                        } else if (detectedType === 'postgresql-local') {
                          savedUrls.pgLocal = e.target.value;
                        } else {
                          savedUrls.pgCloud = e.target.value;
                        }
                        localStorage.setItem('savedDatabaseUrls', JSON.stringify(savedUrls));
                      }}
                      placeholder="أدخل رابط قاعدة البيانات (SQLite أو PostgreSQL)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>سيتم تحديد نوع قاعدة البيانات تلقائياً من الرابط</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  💡 يمكنك تغيير قاعدة البيانات في أي وقت. سيتم إنشاء الجداول تلقائياً في قاعدة البيانات الجديدة.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🔄 الروابط محفوظة تلقائياً - لن تحتاج لإدخالها مرة أخرى!
                </p>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Database Type Selection */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white">
                  اختر نوع قاعدة البيانات
                </label>
                
                <div className="grid gap-4">
                  {/* SQLite Option */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    type === "sqlite" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={type === "sqlite"} 
                        onChange={() => setType("sqlite")}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">SQLite (ملف محلي)</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">مثالي للتطوير والاستخدام المحلي</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* PostgreSQL Local Option */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    type === "postgresql-local" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={type === "postgresql-local"} 
                        onChange={() => setType("postgresql-local")}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">PostgreSQL محلي</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">قاعدة بيانات محلية على جهازك</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* PostgreSQL Cloud Option */}
                  <div className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    type === "postgresql-cloud" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={type === "postgresql-cloud"} 
                        onChange={() => setType("postgresql-cloud")}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">PostgreSQL سحابي</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">قاعدة بيانات سحابية (Neon, Supabase, إلخ)</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                {type === "sqlite" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      مسار ملف SQLite
                    </label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={sqliteFile} 
                      onChange={e => {
                        setSqliteFile(e.target.value);
                        // حفظ الرابط فوراً
                        const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
                        savedUrls.sqlite = e.target.value;
                        localStorage.setItem('savedDatabaseUrls', JSON.stringify(savedUrls));
                      }} 
                      placeholder="./data/dev.db" 
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      سيتم إنشاء الملف تلقائياً إذا لم يكن موجوداً
                    </p>
                  </div>
                )}

                {type === "postgresql-local" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      رابط قاعدة البيانات المحلية
                    </label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={pgLocalUrl} 
                      onChange={e => {
                        setPgLocalUrl(e.target.value);
                        // حفظ الرابط فوراً
                        const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
                        savedUrls.pgLocal = e.target.value;
                        localStorage.setItem('savedDatabaseUrls', JSON.stringify(savedUrls));
                      }} 
                      placeholder="postgresql://username:password@localhost:5432/database"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      تأكد من تشغيل PostgreSQL على جهازك
                    </p>
                  </div>
                )}

                {type === "postgresql-cloud" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      رابط قاعدة البيانات السحابية
                    </label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      value={pgCloudUrl} 
                      onChange={e => {
                        setPgCloudUrl(e.target.value);
                        // حفظ الرابط فوراً
                        const savedUrls = JSON.parse(localStorage.getItem('savedDatabaseUrls') || '{}');
                        savedUrls.pgCloud = e.target.value;
                        localStorage.setItem('savedDatabaseUrls', JSON.stringify(savedUrls));
                      }} 
                      placeholder="postgresql://username:password@host:port/database"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      احصل على الرابط من مزود الخدمة السحابية (Neon, Supabase, إلخ)
                    </p>
                  </div>
                )}
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 dark:text-red-200 font-medium">خطأ:</span>
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 dark:text-green-200 font-medium">نجح الإعداد!</span>
                    <span className="text-green-700 dark:text-green-300">سيتم توجيهك لإنشاء المستخدم الأول...</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري الاختبار والحفظ...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>حفظ وتجربة الاتصال</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💡 نصائح مفيدة
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>SQLite:</strong> مثالي للتطوير والاختبار، لا يحتاج إعداد خادم</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>PostgreSQL محلي:</strong> يحتاج تثبيت PostgreSQL على جهازك</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>PostgreSQL سحابي:</strong> احصل على رابط من Neon أو Supabase أو أي مزود آخر</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
