export function gerarLinkWhatsApp(
  numeroSalao: string,
  mensagemTemplate: string,
  dados: { nome: string; dia: string; hora: string; servico: string }
): string {
  const mensagem = mensagemTemplate
    .replace('{nome}', dados.nome)
    .replace('{dia}', dados.dia)
    .replace('{hora}', dados.hora)
    .replace('{servico}', dados.servico);
  
  const numeroLimpo = numeroSalao.replace(/\D/g, '');
  return `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
}
