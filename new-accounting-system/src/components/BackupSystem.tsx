'use client'

import React, { useState, useRef } from 'react'
import { Download, Upload, CheckCircle, Clock, Database, HardDrive } from './icons'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Modal } from './ui/Modal'
import { 
  createBackup, 
  downloadBackup, 
  uploadBackup, 
  restoreBackup, 
  validateBackup, 
  getBackupInfo 
} from '../lib/backupUtils'
import { BackupData } from '../lib/backupUtils'

interface BackupSystemProps {
  className?: string
}

export const BackupSystem: React.FC<BackupSystemProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'restore' | 'manage'>('create')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [backupInfo, setBackupInfo] = useState<Record<string, unknown> | null>(null)
  // const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const backup = await createBackup({
        includeData: true,
        includeSchema: true,
        compress: false,
      })

      setBackupData(backup)
      setBackupInfo(getBackupInfo(backup))
      setSuccess('تم إنشاء النسخة الاحتياطية بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء النسخة الاحتياطية')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadBackup = () => {
    if (backupData) {
      downloadBackup(backupData)
      setSuccess('تم تحميل النسخة الاحتياطية')
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const backup = await uploadBackup(file)
      const validation = validateBackup(backup)

      if (validation.valid) {
        setBackupData(backup)
        setBackupInfo(getBackupInfo(backup))
        setSuccess('تم تحميل النسخة الاحتياطية بنجاح')
      } else {
        setError(`ملف النسخة الاحتياطية غير صالح: ${validation.errors.join(', ')}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل النسخة الاحتياطية')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!backupData) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      await restoreBackup(backupData)
      setSuccess('تم استعادة النسخة الاحتياطية بنجاح')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في استعادة النسخة الاحتياطية')
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setBackupData(null)
    setBackupInfo(null)
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 ml-2" />
            نظام النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setMode('create')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
            >
              <Download className="w-4 h-4 ml-2" />
              إنشاء نسخة احتياطية
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setMode('restore')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
            >
              <Upload className="w-4 h-4 ml-2" />
              استعادة نسخة احتياطية
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setMode('manage')
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center"
            >
              <HardDrive className="w-4 h-4 ml-2" />
              إدارة النسخ
            </Button>
          </div>

          {/* Status Messages */}
          <div>
            {error && (
              <div
                className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetState()
        }}
        title={
          mode === 'create' ? 'إنشاء نسخة احتياطية' :
          mode === 'restore' ? 'استعادة نسخة احتياطية' :
          'إدارة النسخ الاحتياطية'
        }
        size="lg"
      >
        <div className="space-y-6">
          {mode === 'create' && (
            <div className="space-y-4">
              <div className="text-center">
                <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">إنشاء نسخة احتياطية</h3>
                <p className="text-gray-600">سيتم إنشاء نسخة احتياطية من جميع البيانات</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">ما يتم نسخه احتياطياً:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• جميع الجداول والبيانات</li>
                  <li>• الإعدادات والتكوينات</li>
                  <li>• سجل العمليات</li>
                  <li>• المرفقات والملفات</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateBackup}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء النسخة'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'restore' && (
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">استعادة نسخة احتياطية</h3>
                <p className="text-gray-600">اختر ملف النسخة الاحتياطية للاستعادة</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center mx-auto"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  اختر ملف النسخة الاحتياطية
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  فقط ملفات JSON مدعومة
                </p>
              </div>

              {/* Backup Info */}
              {backupInfo && (
                <div
                  className="bg-gray-50 border rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-3">معلومات النسخة الاحتياطية:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">الإصدار:</span>
                      <span className="font-medium text-gray-900 mr-2">{String(backupInfo['version'])}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-medium text-gray-900 mr-2">{String(backupInfo['timestamp'])}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">عدد السجلات:</span>
                      <span className="font-medium text-gray-900 mr-2">{String(backupInfo['totalRecords'])}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">عدد الجداول:</span>
                      <span className="font-medium text-gray-900 mr-2">{String(backupInfo['tablesCount'])}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleDownloadBackup}
                  disabled={!backupData}
                  variant="outline"
                >
                  تحميل
                </Button>
                <Button
                  onClick={handleRestoreBackup}
                  disabled={!backupData || isLoading}
                  loading={isLoading}
                >
                  {isLoading ? 'جاري الاستعادة...' : 'استعادة'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'manage' && (
            <div className="space-y-4">
              <div className="text-center">
                <HardDrive className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">إدارة النسخ الاحتياطية</h3>
                <p className="text-gray-600">إدارة النسخ الاحتياطية المحفوظة</p>
              </div>

              <div className="text-center text-gray-500 py-8">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p>هذه الميزة قيد التطوير</p>
                <p className="text-sm">ستكون متاحة قريباً</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default BackupSystem