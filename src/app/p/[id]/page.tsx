import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default async function PublicPageView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!page) notFound()

  const markdown = page.content?.markdown ?? ''

  return (
    <div className="min-h-screen bg-white" data-karma-context="public-page" data-karma-auth="none">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            最終更新: {new Date(page.updated_at).toLocaleDateString('ja-JP')}
          </p>
        </header>
        <article className="prose max-w-none">
          {markdown ? (
            <ReactMarkdown>{markdown}</ReactMarkdown>
          ) : (
            <p className="text-gray-400">コンテンツがありません</p>
          )}
        </article>
        <footer className="mt-12 border-t pt-4 text-center text-xs text-gray-400">
          Powered by DAWN DOCS
        </footer>
      </div>
    </div>
  )
}
