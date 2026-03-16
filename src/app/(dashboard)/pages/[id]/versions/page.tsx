'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { toast } from 'sonner'

type Version = {
  id: string
  page_id: string
  content: { markdown: string } | null
  created_by: string | null
  created_at: string
}

export default function VersionHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.id as string
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/pages/${pageId}/versions`)
    if (res.ok) {
      const data = await res.json()
      setVersions(data)
    }
    setLoading(false)
  }, [pageId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  async function handleRestore(version: Version) {
    if (!confirm('このバージョンに復元しますか？')) return

    const res = await fetch(`/api/pages/${pageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: version.content,
      }),
    })

    if (res.ok) {
      toast.success('バージョンを復元しました')
      router.push(`/pages/${pageId}`)
    } else {
      toast.error('復元に失敗しました')
    }
  }

  return (
    <div data-karma-context="version-history" data-karma-auth="required">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/pages/${pageId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ページに戻る
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">バージョン履歴</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : versions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">バージョン履歴がありません</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">バージョン一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>内容プレビュー</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id} data-karma-entity="page-version">
                    <TableCell>
                      {new Date(version.created_at).toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-gray-500">
                      {version.content?.markdown?.substring(0, 100) ?? '(空)'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        data-karma-action="restore-version"
                      >
                        復元
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
