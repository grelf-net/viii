// Part of Pieces of 8
// SharedWorker for keeping observer position the same on 2 pages
// Copyright (c) Graham Relf, UK, 2024
// www.grelf.net
'use strict';

let count = 0, profile = "", me = "";

onconnect = function(e)
{ count++;
  let port = e.ports[0];
  port.postMessage('C:' + count);
  port.onmessage = function(e) 
  { if (e.data.startsWith("setP:")) profile = e.data.substring(5);
    else if (e.data.startsWith("setO:")) me = e.data.substring(5);
    else if (e.data === "getP") port.postMessage("P:" + profile);
    else if (e.data === "getO") port.postMessage("O:" + me);
    else port.postMessage("???:" + e.data);
  };
};
