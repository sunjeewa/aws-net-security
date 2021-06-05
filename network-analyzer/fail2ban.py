import random
import time
src_ips = list()

src_ips.append("10.10.1.1")
src_ips.append("10.10.1.2")

"""
src_ips.append("10.10.1.3")
src_ips.append("10.10.1.4")
src_ips.append("10.10.1.5")
src_ips.append("10.10.1.6")
"""

allow_rate = 2 # 2 requests per second
seen = list()
number_of_requests = 1000
i = 0



# Token bucket 
token_bucket = dict()

def topup_token(ip):
	""" top-up ip tokens if timeout is reached """
	result = token_bucket.get(ip,None)
	if result is not None:
		tokens = result.get("tokens",0)

		if tokens == 0:
			last_access_time = result.get("last_access",0)
			now = time.time()
			diff = (now - last_access_time)

			if diff > 10:
				print("{} last useed {} seconds ago. Topping up".format(ip,diff))
				token_bucket[ip] = {"tokens": 10, "last_access": time.time()}

			


def use_token(ip):
	""" reduce 1 token from bucket for ip """
	result = token_bucket.get(ip,None)
	if result is not None:
	# we found a token record. check token
		tokens = result.get("tokens",0)

		if tokens == 0:
			return tokens 
		else:
			token_bucket[ip] = {"tokens": (tokens - 1), "last_access": time.time()}
			return (tokens - 1)



# topup tokens
for ip in src_ips:
	token_bucket[ip] = {"tokens": 10, "last_access": time.time()}


for a in range(0,number_of_requests):
	ip = random.choice(src_ips)
	time.sleep(0.2)

	# chcking token bucket for ip
	result = token_bucket.get(ip,None)
	if result is not None:
		tokens = use_token(ip)
		if tokens == 0:
			print("{} Deny access. {} tokens left".format(ip,tokens))
			topup_token(ip)
		else:
			print("{} Allow access. {} tokens left".format(ip,tokens))
	else:
		# ip not found in token bucket. Add it
		print("Adding IP {} token bucket with 10 tokens".format(ip))
		token_bucket[ip] = {"tokens": 10, "last_access": time.time()}
		


	#print("checking token bucket for {}".format(token_bucket.get(ip,None)))
	#time.sleep(1)
	# check for token

