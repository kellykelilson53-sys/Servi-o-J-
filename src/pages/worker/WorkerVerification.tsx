import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, CreditCard, Camera, Upload, Check, 
  AlertCircle, ArrowLeft, ArrowRight, Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function WorkerVerification() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Form data
  const [fullName, setFullName] = useState('');
  const [biNumber, setBiNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');

  // Photo uploads
  const [selfie, setSelfie] = useState<File | null>(null);
  const [biFront, setBiFront] = useState<File | null>(null);
  const [biBack, setBiBack] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchWorker() {
      if (!user) return;
      
      const { data } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setWorkerId(data.id);
      }
    }

    if (user) {
      fetchWorker();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.name) {
      setFullName(profile.name);
    }
  }, [profile]);

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!user || profile?.user_type !== 'worker') {
    navigate('/login');
    return null;
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const validateStep1 = () => {
    if (!fullName || !biNumber || !birthDate || !address) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor preencha todos os campos.',
        variant: 'destructive',
      });
      return false;
    }

    if (biNumber.length < 9) {
      toast({
        title: 'BI inválido',
        description: 'O número do BI deve ter pelo menos 9 caracteres.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!selfie || !biFront || !biBack) {
      toast({
        title: 'Fotos obrigatórias',
        description: 'Por favor envie todas as fotos solicitadas.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep2() || !workerId || !user) return;

    setIsSubmitting(true);

    try {
      // Upload files
      const timestamp = Date.now();
      const selfieUrl = await uploadFile(selfie!, `verification/${user.id}/selfie_${timestamp}.jpg`);
      const biFrontUrl = await uploadFile(biFront!, `verification/${user.id}/bi_front_${timestamp}.jpg`);
      const biBackUrl = await uploadFile(biBack!, `verification/${user.id}/bi_back_${timestamp}.jpg`);

      if (!selfieUrl || !biFrontUrl || !biBackUrl) {
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível enviar as fotos. Tente novamente.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Create verification document
      const { error: docError } = await supabase
        .from('verification_documents')
        .upsert({
          worker_id: workerId,
          full_name: fullName,
          bi_number: biNumber,
          birth_date: birthDate,
          address: address,
          selfie_url: selfieUrl,
          bi_front_url: biFrontUrl,
          bi_back_url: biBackUrl,
          submitted_at: new Date().toISOString(),
        });

      if (docError) {
        console.error('Document error:', docError);
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar os documentos. Tente novamente.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Update worker verification status
      await supabase
        .from('workers')
        .update({ verification_status: 'pending' })
        .eq('id', workerId);

      // Call AI verification function (runs now, admin decides final approval)
      try {
        const { error: aiError } = await supabase.functions.invoke('verify-documents', {
          body: { workerId },
        });
        if (aiError) {
          console.warn('AI verification invoke error:', aiError);
        }
      } catch (e) {
        console.warn('AI verification invoke exception:', e);
      }

      toast({
        title: 'Documentos enviados!',
        description: 'A IA analisa agora e o admin faz a aprovação final.',
      });

      navigate('/worker/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/worker/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Verificação de Identidade</h1>
            </div>
            <p className="text-muted-foreground">
              Complete a verificação para começar a receber clientes
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-medium hidden sm:inline">Dados Pessoais</span>
            </div>
            <div className="flex-1 h-1 bg-muted rounded">
              <div className={`h-full bg-primary rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">Documentos</span>
            </div>
          </div>

          {/* Step 1: Personal Data */}
          {step === 1 && (
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Dados do Bilhete de Identidade</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Nome Completo (como no BI)</Label>
                  <Input
                    placeholder="Nome exatamente como está no BI"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número do BI</Label>
                  <Input
                    placeholder="Ex: 000123456LA789"
                    value={biNumber}
                    onChange={(e) => setBiNumber(e.target.value.toUpperCase())}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Morada</Label>
                  <Input
                    placeholder="Endereço completo"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Os dados devem corresponder exatamente ao que consta no seu Bilhete de Identidade. 
                    Informações incorretas podem causar rejeição da verificação.
                  </p>
                </div>

                <Button variant="hero" size="lg" className="w-full" onClick={handleNextStep}>
                  Continuar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Envio de Documentos</h2>
              </div>

              <div className="space-y-6">
                {/* Selfie */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Foto do Rosto (Selfie)
                  </Label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    selfie ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'
                  }`}>
                    {selfie ? (
                      <div className="flex items-center justify-center gap-2 text-success">
                        <Check className="h-5 w-5" />
                        <span>{selfie.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Tire uma selfie clara, com rosto bem visível
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleFileChange(e, setSelfie)}
                      className="hidden"
                      id="selfie-upload"
                    />
                    <label htmlFor="selfie-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>{selfie ? 'Alterar' : 'Tirar Foto'}</span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* BI Front */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Foto do BI (Frente)
                  </Label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    biFront ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'
                  }`}>
                    {biFront ? (
                      <div className="flex items-center justify-center gap-2 text-success">
                        <Check className="h-5 w-5" />
                        <span>{biFront.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Foto clara da frente do BI
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileChange(e, setBiFront)}
                      className="hidden"
                      id="bi-front-upload"
                    />
                    <label htmlFor="bi-front-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>{biFront ? 'Alterar' : 'Tirar Foto'}</span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* BI Back */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Foto do BI (Verso)
                  </Label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    biBack ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'
                  }`}>
                    {biBack ? (
                      <div className="flex items-center justify-center gap-2 text-success">
                        <Check className="h-5 w-5" />
                        <span>{biBack.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Foto clara do verso do BI
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileChange(e, setBiBack)}
                      className="hidden"
                      id="bi-back-upload"
                    />
                    <label htmlFor="bi-back-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>{biBack ? 'Alterar' : 'Tirar Foto'}</span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Dicas para aprovação:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Fotos nítidas e sem reflexos</li>
                    <li>• Documento inteiro visível, sem cortes</li>
                    <li>• Boa iluminação</li>
                    <li>• Selfie sem óculos de sol ou chapéu</li>
                  </ul>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Enviar para Verificação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              A verificação é feita por inteligência artificial e pode levar até 24 horas.
              Seus dados são protegidos e usados apenas para verificação.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
