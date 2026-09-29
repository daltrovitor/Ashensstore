// Hello World
"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

function ResetPasswordContent() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao enviar email de recuperação")
      }

      setSubmitted(true)
      toast.success("Email de recuperação enviado!")

    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha ao enviar email")
      toast.error("Falha ao enviar email de recuperação")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
              <CardDescription>
                Digite seu email para receber um link de recuperação de senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Email de Recuperação"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Email Enviado!</h3>
                    <p className="text-muted-foreground mt-2">
                      Enviamos um email para <strong>{email}</strong> com instruções para recuperar sua senha.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/login')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                  </Button>
                </div>
              )}

              {!submitted && (
                <div className="mt-4 text-center text-sm">
                  <a
                    href="/login"
                    className="text-primary hover:underline"
                  >
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    Voltar para Login
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
