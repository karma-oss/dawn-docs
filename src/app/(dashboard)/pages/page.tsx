'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'

type Page = {
  id: string
  workspace_id: string
  parent_id: string | null
  title: string
  is_public: boolean
  created_at: string
  updated_at: string
}

function buildTree(pages: Page[], parentId: string | null = null, depth: number = 0): (Page & { depth: number })[] {
  const result: (Page & { depth: number })[] = []
  const children = pages.filter(p => p.parent_id === parentId)
  for (const child of children) {
    result.push({ ...child, depth })
    result.push(...buildTree(pages, child.id, depth + 1))
  }
  return result
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [parentId, setParentId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  const loadPages = useCallback(async () => {
    const res = await fetch('/api/pages')
    if (res.ok) {
      const data = await res.json()
      setPages(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  async function handleCreate() {
    if (!title.trim()) return
    const body: Record<string, string> = { title }
    if (parentId) body.parent_id = parentId

    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.success('ページを作成しました')
      setTitle('')
      setParentId('')
      setDialogOpen(false)
      loadPages()
    } else {
      const err = await res.json()
      toast.error(err.error || '作成に失敗しました')
    }
  }

  const treePages = buildTree(pages)

  return (
    <div data-karma-context="pages-list" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ページ</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button data-karma-action="create-page" data-karma-test-id="create-page-btn" />}>
            新規ページ
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規ページ作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-title">タイトル</Label>
                <Input
                  id="page-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ページタイトル"
                  data-karma-test-id="page-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label>親ページ (任意)</Label>
                <Select value={parentId} onValueChange={(v) => setParentId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="なし (トップレベル)" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                キャンセル
              </DialogClose>
              <Button onClick={handleCreate} data-karma-test-id="submit-page-btn">
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : treePages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">ページがまだありません。最初のページを作成しましょう。</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ページ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {treePages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50 transition-colors"
                  style={{ paddingLeft: `${page.depth * 24 + 8}px` }}
                  data-karma-entity="page"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{page.title}</span>
                    {page.is_public && <Badge variant="secondary">公開</Badge>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString('ja-JP')}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
