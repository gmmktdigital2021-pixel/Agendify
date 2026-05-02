export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-10">Última atualização: 01 de maio de 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quem somos</h2>
            <p>O Agendify é uma plataforma de agendamento online para profissionais de beleza, operada pela G&M Negócios Digitais. Nosso site é agendify-plpd.vercel.app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Quais dados coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome e endereço de e-mail ao criar uma conta</li>
              <li>Dados de pagamento processados pelo Stripe (não armazenamos dados de cartão)</li>
              <li>Informações dos seus clientes cadastrados na plataforma</li>
              <li>Dados de agendamentos e serviços</li>
              <li>Dados de uso e navegação para melhorar a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Para fornecer e melhorar nossos serviços</li>
              <li>Para processar pagamentos e gerenciar assinaturas</li>
              <li>Para enviar comunicações sobre sua conta</li>
              <li>Para cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
            <p>Não vendemos seus dados pessoais. Compartilhamos apenas com parceiros necessários para operação do serviço, como Stripe (pagamentos) e Supabase (banco de dados), todos com políticas de privacidade próprias e adequadas à LGPD.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Seus direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Segurança</h2>
            <p>Utilizamos criptografia, autenticação segura e boas práticas de segurança para proteger seus dados. Nossos servidores ficam na infraestrutura da Vercel e Supabase.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contato</h2>
            <p>Para dúvidas sobre privacidade, entre em contato: <strong>gmmktdigital2021@gmail.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
