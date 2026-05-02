export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-gray-500 mb-10">Última atualização: 01 de maio de 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos termos</h2>
            <p>Ao criar uma conta no Agendify, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do serviço</h2>
            <p>O Agendify é uma plataforma SaaS de agendamento online para profissionais de beleza. Oferecemos planos gratuito, profissional e premium com diferentes funcionalidades e limites.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Planos e pagamentos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>O plano gratuito não requer pagamento e possui limites de uso</li>
              <li>Os planos pagos são cobrados mensalmente via cartão de crédito</li>
              <li>Os pagamentos são processados pelo Stripe com segurança</li>
              <li>Você pode cancelar sua assinatura a qualquer momento</li>
              <li>Não há reembolso por períodos parciais já utilizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Responsabilidades do usuário</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter suas credenciais de acesso em segurança</li>
              <li>Usar a plataforma apenas para fins legais</li>
              <li>Não compartilhar acesso com terceiros não autorizados</li>
              <li>Manter os dados dos seus clientes atualizados e corretos</li>
              <li>Cumprir a LGPD em relação aos dados dos seus próprios clientes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitação de responsabilidade</h2>
            <p>O Agendify não se responsabiliza por perdas de negócio decorrentes de indisponibilidade temporária do serviço. Nos esforçamos para manter disponibilidade de 99,9% ao mês.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cancelamento</h2>
            <p>Você pode cancelar sua conta a qualquer momento. Após o cancelamento, seus dados ficam disponíveis por 30 dias antes de serem excluídos permanentemente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Alterações nos termos</h2>
            <p>Podemos atualizar estes termos com aviso prévio de 15 dias por e-mail. O uso continuado do serviço após as alterações implica aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Lei aplicável</h2>
            <p>Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer disputas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contato</h2>
            <p>Dúvidas sobre os termos: <strong>gmmktdigital2021@gmail.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
