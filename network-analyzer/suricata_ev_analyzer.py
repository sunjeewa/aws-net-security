import json
from pprint import pprint
import bisect
import time
import os
import subprocess
os.nice(10) # to prevent this script from locking up the server


with open ('/var/log/suricata/eve.json') as data_file:
    for hit in data_file:
        packet = json.loads(hit)
        try:

            timestamp = (packet.get("timestamp",None))
            proto = (packet.get("proto",None))
            src_ip = (packet.get("src_ip",None))
            dest_ip = (packet.get("dest_ip",None))
            src_port = (packet.get("src_port",None))
            dest_port = (packet.get("dest_port",None))

            if timestamp is not None:
                print("[{}] {} src_ip:{} src_port:{} dest_ip:{} dest_port:{}".format(timestamp,proto, src_ip, src_port, dest_ip, dest_port))
        except ValueError: # this prevents packets that are false positives from breaking program
            continue
