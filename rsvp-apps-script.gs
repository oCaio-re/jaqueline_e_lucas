/**
 * RSVP — Casamento Jaqueline & Lucas
 * Backend leve (sem planilha): guarda as confirmações no próprio script,
 * envia um e-mail aos noivos a cada resposta e fornece os dados à página
 * de administração (admin.html) protegida por palavra-passe.
 *
 * COMO INSTALAR (passo a passo):
 *  1. Abra  https://script.new   (cria um projeto Apps Script novo).
 *  2. Apague o código que aparecer e COLE todo este ficheiro.
 *  3. Em baixo, troque a PALAVRA-PASSE (SENHA) por uma à sua escolha.
 *  4. Guarde (💾).
 *  5. Clique em  Implementar (Deploy) → Nova implementação.
 *  6. No ícone de engrenagem, escolha  Aplicação Web (Web app):
 *       - Executar como:  Eu (a sua conta)
 *       - Quem tem acesso:  Qualquer pessoa (Anyone)
 *     Clique  Implementar  e autorize (Avançado → Aceder ao projeto → Permitir).
 *  7. Copie o  URL da aplicação web  (termina em  /exec ).
 *  8. Envie-me esse URL e a palavra-passe que escolheu — eu ligo o site
 *     e a página de administração.
 */

// ⚠️ TROQUE por uma palavra-passe à sua escolha (a mesma que usará no admin):
var SENHA = 'jaqueline-lucas-2026';

// E-mail que recebe a notificação de cada confirmação:
var EMAIL_NOIVOS = 'jasasilva@outlook.pt';

/* ---------- Recebe uma confirmação do site ---------- */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var key = 'rsvp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    props.setProperty(key, JSON.stringify(d));

    var presenca = (d.attend === 'sim') ? 'VAI ESTAR PRESENTE ✅' : 'Não poderá ir 💔';
    MailApp.sendEmail({
      to: EMAIL_NOIVOS,
      subject: '💍 Nova confirmação: ' + d.name + ' — ' + presenca,
      body: 'Nome: ' + d.name +
            '\nE-mail: ' + (d.email || '—') +
            '\nPresença: ' + presenca +
            '\nNº de pessoas: ' + d.guests +
            '\nMensagem: ' + (d.message || '—') +
            '\nRestrições alimentares: ' + (d.diet || '—')
    });

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('erro: ' + err);
  }
}

/* ---------- Fornece/gere os dados para a página admin (via JSONP) ---------- */
function doGet(e) {
  var cb = e.parameter.callback;

  if (e.parameter.token !== SENHA) {
    return reply(cb, { ok: false, error: 'unauthorized' });
  }

  var props = PropertiesService.getScriptProperties();

  // Apagar uma confirmação
  if (e.parameter.action === 'delete' && e.parameter.key) {
    props.deleteProperty(e.parameter.key);
    return reply(cb, { ok: true, deleted: e.parameter.key });
  }

  // Listar todas as confirmações
  var all = props.getProperties();
  var rows = [];
  for (var k in all) {
    if (k.indexOf('rsvp_') === 0) {
      try {
        var r = JSON.parse(all[k]);
        r._key = k;
        rows.push(r);
      } catch (_) {}
    }
  }
  rows.sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
  return reply(cb, { ok: true, rows: rows });
}

function reply(cb, obj) {
  var json = JSON.stringify(obj);
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
