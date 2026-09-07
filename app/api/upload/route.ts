import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseService()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Serviço do banco de dados não configurado' },
        { status: 500 }
      )
    }

    // Pega o arquivo do form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Valida o tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF' },
        { status: 400 }
      )
    }

    // Valida o tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 10MB' },
        { status: 400 }
      )
    }

    // Gera nome único limpo
    const fileExt = file.name.split('.').pop() || 'png'
    const cleanOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${Date.now()}-${cleanOriginal}`
    const filePath = `uploads/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Faz upload para o Supabase Storage no bucket 'products'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type
    })

  } catch (error: any) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Para deletar arquivos
export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseService()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Serviço do banco de dados não configurado' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: 'Caminho do arquivo não informado' },
        { status: 400 }
      )
    }

    // Deleta o arquivo do bucket products
    const { error } = await supabase.storage
      .from('products')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    })

  } catch (error: any) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
