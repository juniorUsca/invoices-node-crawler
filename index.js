var _request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var json2xls = require('json2xls');
var nodeExcel = require('excel-export');
//const fs = require('fs');

const req = _request.defaults({jar: true})

function request(value) {
  return new Promise(function (resolve, reject) {
    _request(value, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

function request_with_cookies(value) {
  return new Promise(function (resolve, reject) {
    req(value, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}


function request_get(url, callback) {
  _request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        callback(body)
      } else {
        console.log('--', error)
      }
  })
}

function request_post(options, callback) {
  _request.post(options, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        callback(body)
      } else {
        console.log('--', error)
      }
  })
}

function request_post_cookies(options, callback) {
  req.post(options, function (error, res, body) {
    if (!error && res.statusCode == 200) {
      callback(body);
    } else {
      console.log('--', error)
    }
  })
}


const $inputs_template = {
  'ctl00$ScriptManager1': 'ctl00$MainContent$UpdatePanel1|ctl00$MainContent$btnBuscar',
  'ctl00$MainContent$tipoComprobante': 'rbFactura',
  'ctl00$MainContent$chkRangoFecha': 'on',
  'ctl00$MainContent$dtpFecha$txtdtpFecha': '02/07/2019',
  'ctl00$MainContent$dtpFecha$meEdtpFecha_ClientState': '',
  'ctl00$MainContent$dtpFechaHasta$txtdtpFechaHasta': '',
  'ctl00$MainContent$dtpFechaHasta$meEdtpFechaHasta_ClientState': '',
  'ctl00$MainContent$txtRuc': '',
  'ctl00$MainContent$txtPtoVta': '',
  'ctl00$MainContent$txtTicket': '',
  '__EVENTTARGET': '',
  '__EVENTARGUMENT': '',
  '__LASTFOCUS': '',
  '__VIEWSTATE': '_',
  '__EVENTVALIDATION': '_',
  '__ASYNCPOST': 'true',
  //'ctl00$MainContent$btnBuscar': 'Buscar',
}

const prepare_body_post = ($inputs) => {
  const la_entries = Object.entries($inputs).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
  return la_entries.join('&')
}


const get_homepage_data = async () => {
  try {
    const response = await request('http://190.117.78.100/DocumentosGeneradosSUNAT/')
    return response
  } catch (error) {
    console.log('--', error)
  }
}

const get_data_on_clicked_date_range = async (html_text, date) => {
  const $inputs = { ...$inputs_template }
  $inputs['ctl00$ScriptManager1'] = 'ctl00$MainContent$UpdatePanel1|ctl00$MainContent$chkRangoFecha'
  $inputs['__EVENTTARGET'] = 'ctl00$MainContent$chkRangoFecha'
  $inputs['ctl00$MainContent$dtpFecha$txtdtpFecha'] = date
  const { __VIEWSTATE, __EVENTVALIDATION } = parse_data_from_html(html_text)
  $inputs['__VIEWSTATE'] = __VIEWSTATE
  $inputs['__EVENTVALIDATION'] = __EVENTVALIDATION

  const body = prepare_body_post($inputs)+'&'
  try {
    const response = await request_with_cookies({
      method: 'POST',
      url: 'http://190.117.78.100/DocumentosGeneradosSUNAT/',
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-MicrosoftAjax': 'Delta=true',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
      },
      body: body,
    })
    return response
  } catch (error) {
    console.log('--', error)
  }
}


const get_invoices_data = async (html_text, date) => {
  const $inputs = { ...$inputs_template }
  $inputs['ctl00$MainContent$btnBuscar'] = 'Buscar'
  const { __VIEWSTATE, __EVENTVALIDATION } = parse_data_from_asp(html_text)
  $inputs['__VIEWSTATE'] = __VIEWSTATE
  $inputs['__EVENTVALIDATION'] = __EVENTVALIDATION

  $inputs['ctl00$MainContent$dtpFecha$txtdtpFecha'] = date
  $inputs['ctl00$MainContent$dtpFechaHasta$txtdtpFechaHasta'] = date
  $inputs['ctl00$MainContent$txtRuc'] = '20506421781' // rico pollo ruc
  $inputs['__AjaxControlToolkitCalendarCssLoaded'] = ''
  
  const body = prepare_body_post($inputs)
  try {
    const response = await request_with_cookies({
      method: 'POST',
      url: 'http://190.117.78.100/DocumentosGeneradosSUNAT/',
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'X-MicrosoftAjax': 'Delta=true',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
      },
      body: body,
    })
    return response
  } catch (error) {
    console.log('--', error)
  }
}

const parse_data_from_html = (html) => {
  $ = cheerio.load(html)
  const __VIEWSTATE = $('input[name="__VIEWSTATE"]').val()
  const __EVENTVALIDATION = $('input[name="__EVENTVALIDATION"]').val()
  return {
    __VIEWSTATE,
    __EVENTVALIDATION,
  }
}

const parse_data_from_asp = (asp_text) => {
  let pos = asp_text.indexOf('__VIEWSTATE')
  let _asp_text = asp_text.substring(pos+11+1)
  pos = _asp_text.indexOf('|')
  const __VIEWSTATE = _asp_text.substring(0,pos)
  
  pos = asp_text.indexOf('__EVENTVALIDATION')
  _asp_text = asp_text.substring(pos+17+1)
  pos = _asp_text.indexOf('|')
  const __EVENTVALIDATION = _asp_text.substring(0,pos)
  
  return {
    __VIEWSTATE,
    __EVENTVALIDATION,
  }
}



const get_invoices_from_asptext = (asp_text) => {
  let pos = asp_text.indexOf('ctl00_MainContent_UpdatePanel1')
  let _asp_text = asp_text.substring(pos+30+1)
  pos = _asp_text.indexOf('|')
  const html_text = _asp_text.substring(0,pos)
  
  $ = cheerio.load(html_text)
  const $rows = $('input[type="submit"].descargaPDF')
  const registers = []
  $rows.map((_, $el) => {
    
    const js_text = $($el).attr('onclick')

    let pos = js_text.indexOf('FACTURA ELECTRÓNICA [ENTER]')
    let _js_text = js_text.substring(pos+27)
    pos = _js_text.indexOf('[ENTER]')
    const FACTURA = _js_text.substring(0,pos)

    pos = js_text.indexOf('Fecha de Emisión: ')
    _js_text = js_text.substring(pos+18)
    pos = _js_text.indexOf('[ENTER]')
    const FECHA = _js_text.substring(0,pos)

    pos = js_text.indexOf('[ENTER]RUC: ')
    _js_text = js_text.substring(pos+12)
    pos = _js_text.indexOf('[ENTER]')
    const RUC = _js_text.substring(0,pos)

    pos = js_text.indexOf('[ENTER]Op. Gravada: ')
    _js_text = js_text.substring(pos+20)
    pos = _js_text.indexOf('[ENTER]')
    const OP_GRAVADA = _js_text.substring(0,pos).trim().substring(3).trim()

    pos = js_text.indexOf('[ENTER]Op. Inafecta: ')
    _js_text = js_text.substring(pos+21)
    pos = _js_text.indexOf('[ENTER]')
    const OP_INAFECTA = _js_text.substring(0,pos).trim().substring(3).trim()

    pos = js_text.indexOf('[ENTER]Op. Exonerada: ')
    _js_text = js_text.substring(pos+22)
    pos = _js_text.indexOf('[ENTER]')
    const OP_EXONERADA = _js_text.substring(0,pos).trim().substring(3).trim()
    
    pos = js_text.indexOf('[ENTER]I.G.V.: ')
    _js_text = js_text.substring(pos+15)
    pos = _js_text.indexOf('[ENTER]')
    const IGV = _js_text.substring(0,pos).trim().substring(3).trim()

    pos = js_text.indexOf('[ENTER]Importe Total: ')
    _js_text = js_text.substring(pos+22)
    pos = _js_text.indexOf('[ENTER]')
    const TOTAL = _js_text.substring(0,pos).trim().substring(3).trim()

    pos = js_text.indexOf('[ENTER]Placa: ')
    _js_text = js_text.substring(pos+14)
    pos = _js_text.indexOf('[ENTER]')
    const PLACA = _js_text.substring(0,pos)

    registers.push({
      FACTURA,
      FECHA,
      RUC,
      OP_GRAVADA,
      OP_INAFECTA,
      OP_EXONERADA,
      IGV,
      TOTAL,
      PLACA,
    })
  })

  return registers
}

const crawl_invoices = async (date) => {
  let html_text = await get_homepage_data()
  html_text = await get_data_on_clicked_date_range(html_text, date)
  html_text = await get_invoices_data(html_text, date)

  return get_invoices_from_asptext(html_text)
}

const response_data_crawled = async (res, date) => {
  const rows = await crawl_invoices(date)
  //var xls = json2xls(rows);
  //fs.writeFileSync('data.xlsx', xls, 'binary');

  //var readStream = fs.createWriteStream(xls);
  //readStream.pipe(res);
  
  //res.writeHead(200, {'Content-Type': 'application/json'});
  //res.write(JSON.stringify(rows));
  var conf = json2xls.prepareJson(rows)
  var result = nodeExcel.execute(conf);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader("Content-Disposition", "attachment; filename=" + `Facturas-${date}.xlsx`);
  res.end(result, 'binary');
}

const parseParams = (tcParams) => {
  return tcParams.split('&').reduce((acc, tcPair) => {
    const [ key, value ] = tcPair.split('=')
    acc[key] = value
    return acc
  }, {})
}






http.createServer(function(req, res) {
  const [ url, params ] = req.url.split('?')
  
  const tdDate = new Date()
  let lcDate = ("0" + tdDate.getDate()).slice(-2) + "/" + ("0"+(tdDate.getMonth()+1)).slice(-2) + "/" + tdDate.getFullYear()
  if (params) {
    const loParams = parseParams( params );
    if(loParams['fecha']) {
      const arr = loParams['fecha'].split('/')
      if(arr.length == 3 && arr[0] && arr[0].length==2 && arr[1] && arr[1].length==2 && arr[2] && arr[2].length==4 )
        lcDate = loParams['fecha']
    }
  }

  if( url == '/' ) {
    console.log(`new request of date ${lcDate}`)
    response_data_crawled(res, lcDate)
  } else {
    res.writeHead(404,{'Content-Type':'text/html'});
    res.end('404 error');
  }

}).listen(9090);
console.log ("server on port 9090");