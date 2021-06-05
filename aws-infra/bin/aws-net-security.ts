#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsNetSecurityStack } from '../lib/aws-net-security-stack';
import { AwsNetSecurityDemoStack } from '../lib/demo-stack';

const app = new cdk.App();
new AwsNetSecurityStack(app, 'AwsNetSecurityStack', {
  env: { account: '560133137152', region: 'ap-southeast-2' },
});
new AwsNetSecurityDemoStack(app, 'aws-net-security-demo-stack', {
  env: { account: '560133137152', region: 'ap-southeast-2' },
});
