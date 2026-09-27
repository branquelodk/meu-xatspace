# Meu Xatspace no GitHub Pages

O workflow em `.github/workflows/pages.yml` publica o site quando há um push na branch `main`. A arte usada no build é otimizada e copiada temporariamente para os arquivos públicos do site; ela não depende do armazenamento temporário do preview Manus.

## Usar no xatspace

O arquivo `xatframe.html` é um fundo estático, sem cookies, rastreadores ou controles interativos. Depois do primeiro deploy, a URL correspondente será `https://branquelodk.github.io/meu-xatspace/xatframe.html`. No xat, abra `xat.com/editme`, cole essa URL no campo `xatframe` e salve. O recurso xatframe exige o Me power. O xatframe define o fundo; a página de perfil e sua seção Media continuam sendo controladas pelo xat.

Para a rádio, a seção Media do xatspace aceita códigos especiais. No editor de Media, habilite a visualização de código e use o gerador oficial de código de rádio com o stream HTTPS `https://sbox1.sonybox.top:9012/live`; a documentação xat descreve a opção `radiohtml5` para streams Shoutcast/Icecast. O site independente na raiz também mantém o player com essa estação.

## Personalização

O formulário do site independente salva perfil e fotos somente no navegador em que foi editado; ele não publica automaticamente os dados para outros visitantes. Para alterar os valores públicos padrão, edite `DEFAULT_PROFILE` em `client/src/pages/Home.tsx` e envie as mudanças à branch `main`. Não inclua senhas, tokens ou dados privados no repositório público.
