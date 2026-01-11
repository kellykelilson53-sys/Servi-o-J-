import { Layout } from '@/components/layout/Layout';
import { ChevronLeft, Phone, Mail, MessageCircle, HelpCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Help() {
  const navigate = useNavigate();

  const faqCategories = [
    {
      title: 'Para Clientes',
      items: [
        {
          question: 'Como encontro um profissional?',
          answer: 'Aceda à secção "Serviços" no menu, escolha a categoria desejada e verá todos os profissionais verificados disponíveis na sua província.'
        },
        {
          question: 'Como funciona o cálculo do preço?',
          answer: 'O preço total é composto pelo preço base do serviço definido pelo profissional, mais um valor por quilómetro calculado com base na distância entre o profissional e o local do serviço.'
        },
        {
          question: 'Como faço o pagamento?',
          answer: 'O pagamento é feito directamente ao profissional após a conclusão do serviço. Pode pagar em dinheiro, por Multicaixa Express ou transferência bancária, conforme acordado com o profissional.'
        },
        {
          question: 'Posso cancelar um agendamento?',
          answer: 'Sim, pode cancelar através do seu painel de controlo. Recomendamos cancelar com pelo menos 2 horas de antecedência para não prejudicar o profissional.'
        },
        {
          question: 'E se o profissional não aparecer?',
          answer: 'Entre em contacto connosco imediatamente. Todos os profissionais são verificados e monitorizamos a qualidade do serviço através das avaliações.'
        }
      ]
    },
    {
      title: 'Para Profissionais',
      items: [
        {
          question: 'Como me registo como profissional?',
          answer: 'Clique em "Seja um Profissional" ou registe-se escolhendo a opção "Sou Profissional". Depois complete a verificação de identidade para activar sua conta.'
        },
        {
          question: 'O que preciso para a verificação?',
          answer: 'Precisa de uma foto clara do seu BI (frente e verso) e uma selfie actual. O processo de verificação leva até 24 horas úteis.'
        },
        {
          question: 'Quanto custa usar a plataforma?',
          answer: 'O registo e uso da plataforma são completamente gratuitos. Não cobramos comissões ou taxas sobre os serviços realizados.'
        },
        {
          question: 'Como defino meus preços?',
          answer: 'No seu painel, pode definir um preço base para o serviço e um valor por quilómetro de deslocação. Recomendamos pesquisar preços praticados no mercado.'
        },
        {
          question: 'Como recebo os pagamentos?',
          answer: 'Os pagamentos são feitos directamente pelo cliente a si. Combine a forma de pagamento preferida (dinheiro, Multicaixa, transferência) com cada cliente.'
        },
        {
          question: 'Posso recusar um pedido?',
          answer: 'Sim, pode recusar pedidos que não se adequem à sua disponibilidade ou preferência. Contudo, recusas frequentes podem afectar sua visibilidade na plataforma.'
        }
      ]
    },
    {
      title: 'Conta e Segurança',
      items: [
        {
          question: 'Esqueci minha senha, o que faço?',
          answer: 'Na página de login, clique em "Esqueceu a palavra-passe?" e siga as instruções para recuperar o acesso à sua conta.'
        },
        {
          question: 'Como altero meus dados de perfil?',
          answer: 'Aceda ao seu painel de controlo e clique em "Definições" ou "Editar Perfil" para actualizar suas informações.'
        },
        {
          question: 'Como elimino minha conta?',
          answer: 'Entre em contacto com o nosso suporte e solicite a eliminação da conta. Processaremos o pedido em até 7 dias úteis.'
        },
        {
          question: 'Meus dados estão seguros?',
          answer: 'Sim, utilizamos encriptação e seguimos as melhores práticas de segurança para proteger suas informações pessoais.'
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Como podemos ajudar?
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Encontre respostas para as perguntas mais frequentes ou entre em contacto connosco.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            <a 
              href="tel:+244929939469"
              className="bg-card rounded-2xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Telefone</h3>
              <p className="text-primary font-medium">+244 929 939 469</p>
              <p className="text-sm text-muted-foreground mt-1">Seg-Sex, 8h-18h</p>
            </a>

            <a 
              href="mailto:kellykelilson53@gmail.com"
              className="bg-card rounded-2xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-success/10 flex items-center justify-center">
                <Mail className="h-7 w-7 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-success font-medium break-all">kellykelilson53@gmail.com</p>
              <p className="text-sm text-muted-foreground mt-1">Resposta em 24h</p>
            </a>

            <a 
              href="https://wa.me/244929939469"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card rounded-2xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <MessageCircle className="h-7 w-7 text-[#25D366]" />
              </div>
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-[#25D366] font-medium">+244 929 939 469</p>
              <p className="text-sm text-muted-foreground mt-1">Resposta rápida</p>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            </div>

            <div className="space-y-8">
              {faqCategories.map((category, catIndex) => (
                <div key={catIndex}>
                  <h3 className="text-lg font-semibold mb-4 text-primary">
                    {category.title}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem 
                        key={itemIndex} 
                        value={`${catIndex}-${itemIndex}`}
                        className="bg-card rounded-xl border border-border/50 px-6"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-secondary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ainda precisa de ajuda?
            </h2>
            <p className="text-muted-foreground mb-6">
              A nossa equipa de suporte está pronta para ajudá-lo com qualquer questão.
            </p>
            <Button variant="hero" onClick={() => window.location.href = 'mailto:kellykelilson53@gmail.com'}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
