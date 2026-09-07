"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Package, LogOut, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { formatPhone } from '@/components/ui/inputMasks'

interface Order {
  id: string
  external_id: string
  status: string
  customer_name: string
  total: number
  created_at: string
  tracking_number?: string
  tracking_url?: string
}

function ProfileContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Form data
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: formatPhone((user as any).phone || ''),
        avatar_url: (user as any).avatar_url || ''
      })
      fetchOrders()
    }
    setLoading(false)
  }, [user])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/user/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!')
      } else {
        throw new Error('Falha ao atualizar perfil')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Falha ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending_payment': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'in_production': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-emerald-100 text-emerald-800',
      'canceled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      'pending_payment': 'Pagamento Pendente',
      'paid': 'Pago',
      'in_production': 'Em Produção',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'canceled': 'Cancelado'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-muted rounded-lg h-64"></div>
                <div className="bg-muted rounded-lg h-64"></div>
              </div>
              <div className="bg-muted rounded-lg h-96"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações e acompanhe seus pedidos
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="orders">
                <Package className="h-4 w-4 mr-2" />
                Acompanhar Pedidos
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seus dados pessoais e informações de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      onInput={(e) => {
                        const input = e.currentTarget as HTMLInputElement
                        input.value = formatPhone(input.value)
                        setProfileData({ ...profileData, phone: input.value })
                      }}
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={saving} className="bg-[#48B9FA] hover:bg-[#20a6f5] text-white cursor-pointer">
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Pedidos</CardTitle>
                  <CardDescription>
                    Acompanhe o status e converse em tempo real sobre seus pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acompanhar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.external_id}
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(order.status)}>
                                {formatStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/pedidos?order_id=${order.id}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#48B9FA] hover:text-[#20a6f5] transition-colors cursor-pointer"
                              >
                                Rastrear Pedido &rarr;
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Você ainda não fez nenhum pedido.
                      </p>
                      <Button className="mt-4 bg-[#48B9FA] hover:bg-[#20a6f5] text-white cursor-pointer" asChild>
                        <Link href="/loja">Fazer Pedido</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sign Out Button */}
          <div className="mt-8 pt-8 border-t">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48B9FA]"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
