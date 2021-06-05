import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class AwsNetSecurityStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here


    const vps = ec2.Vpc.fromLookup(this,"vpc",{
      vpcName: "aws-net-security-demo-stack/vpc"
    })

    const dummySQ = new ec2.SecurityGroup(this,"DummySQ",{
      vpc:vps,
    })
    dummySQ.connections.allowFromAnyIpv4(ec2.Port.tcp(80))




  }
}
