import urllib.request
import json
req = urllib.request.Request('https://api.comick.app/v1.0/search?q=naruto&limit=1', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Search:", data[0]['slug'])
        
        req2 = urllib.request.Request('https://api.comick.app/comic/' + data[0]['slug'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2) as response2:
             data2 = json.loads(response2.read().decode())
             hid = data2['comic']['hid']
             print("HID:", hid)
             
             req3 = urllib.request.Request('https://api.comick.app/comic/' + hid + '/chapters?lang=pt-br,pt,en&limit=5', headers={'User-Agent': 'Mozilla/5.0'})
             with urllib.request.urlopen(req3) as response3:
                  data3 = json.loads(response3.read().decode())
                  print("Chapters:", data3['chapters'][0]['chap'])
                  
                  chap_hid = data3['chapters'][0]['hid']
                  req4 = urllib.request.Request('https://api.comick.app/chapter/' + chap_hid, headers={'User-Agent': 'Mozilla/5.0'})
                  with urllib.request.urlopen(req4) as response4:
                       data4 = json.loads(response4.read().decode())
                       print("Images:", data4['chapter']['images'][0]['url'])
except Exception as e:
    print(e)
