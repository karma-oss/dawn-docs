'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { toast } from 'sonner'

type PageData = {
  id: string
  workspace_id: string
  parent_id: string | null
  title: string
  content: { markdown: string } | null
  is_public: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export default function PageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [page, setPage] = useState<PageData | null>(null)
  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPage = useCallback(async () => {
    const res = await fetch(`/api/pages/${id}`)
    if (res.ok) {
      const data = await res.json()
      setPage(data)
      setTitle(data.title)
      setMarkdown(data.content?.markdown ?? '')
      setIsPublic(data.is_public)
    } else {
      toast.error('ページが見つかりません')
      router.push('/pages')
    }
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content: { markdown },
        is_public: isPublic,
      }),
    })

    if (res.ok) {
      toast.success('保存しました')
      // Also create a version snapshot
      await fetch(`/api/pages/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { markdown } }),
      })
    } else {
      const err = await res.json()
      toast.error(err.error || '保存に失敗しました')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('このページを削除しますか？')) return
    const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('ページを削除しました')
      router.push('/pages')
    } else {
      toast.error('削除に失敗しました')
    }
  }

  if (loading) return <p className="text-sm text-gray-500">読み込み中...</p>
  if (!page) return null

  return (
    <div data-karma-context="page-editor" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/pages" className="text-sm text-gray-500 hover:text-gray-700">
            ページ一覧
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold">{page.title}</h1>
          {page.is_public && <Badge variant="secondary">公開</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pages/${id}/versions`}>
            <Button variant="outline" size="sm">バージョン履歴</Button>
          </Link>
          {page.is_public && (
            <Link href={`/p/${id}`} target="_blank">
              <Button variant="outline" size="sm">公開ページを見る</Button>
            </Link>
          )}
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete} data-karma-action="delete-page">
            削除
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ページ編集</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">タイトル</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-karma-test-id="edit-title-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="is-public">公開ページとして表示</Label>
          </div>

          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">編集</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Markdownで記述..."
                className="min-h-[400px] font-mono"
                data-karma-test-id="markdown-editor"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose max-w-none rounded-md border p-4 min-h-[400px]">
                {markdown ? (
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400">プレビューするコンテンツがありません</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} data-karma-action="save-page" data-karma-test-id="save-page-btn">
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
