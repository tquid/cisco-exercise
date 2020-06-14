import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Below code based off the tutorial at https://www.pulumi.com/docs/tutorials/aws/ec2-webserver/

const size = "t2.micro";     // t2.micro is available in the AWS free tier
const ami = pulumi.output(aws.getAmi({
    filters: [{
        name: "name",
        values: ["amzn-ami-hvm-*"],
    }],
    owners: ["137112412989"], // This owner ID is Amazon
    mostRecent: true,
}));

const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

const web_subnet = new aws.ec2.Subnet("subnet-web", {
    cidrBlock: "10.0.0.0/24",
    tags: {
        Name: "subnet-web",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const bastion_subnet = new aws.ec2.Subnet("subnet-bastion", {
    cidrBlock: "10.0.1.0/24",
    tags: {
        Name: "bastion-web",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const app_subnet = new aws.ec2.Subnet("subnet-app", {
    cidrBlock: "10.0.2.0/24",
    tags: {
        Name: "subnet-app",
    },
    vpcId: vpc.id,
    availabilityZone: "ca-central-1a"
});

const gw = new aws.ec2.InternetGateway("gw", {
    tags: {
        Name: "gw",
    },
    vpcId: vpc.id,
})

const bastion_group = new aws.ec2.SecurityGroup("bastion", {
    // Repalce cidrBlocks with your own IP or CIDR range
    ingress: [{ 
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["174.6.14.57/32"]},
    ],
    vpcId: vpc.id,
    tags: {
        Name: "sg_bastion",
    },
});

const www_group = new aws.ec2.SecurityGroup("webserver", {
    vpcId: vpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
    },
    {
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        securityGroups: [bastion_group.id]
    }],
    tags: {
        Name: "sg_webserver",
    },
});

const app_group = new aws.ec2.SecurityGroup("appserver", {
    ingress: [{
        protocol: "tcp",
        securityGroups: [www_group.id],
        fromPort: 80,
        toPort: 80
    },
    {
        protocol: "tcp",
        securityGroups: [bastion_group.id],
        fromPort: 22,
        toPort: 22
    }],
    egress: [{
        protocol: "-1",
        cidrBlocks: ["127.0.0.1/32"],
        fromPort: 0,
        toPort: 0,
    }], // No backsies on the www_group!
    vpcId: vpc.id,
    tags: {
        Name: "sg_appserver"
    },
});

const userData = 
`#!/bin/bash
sudo yum update -y
sudo yum install -y httpd24
sudo yum install -y curl`;

const webserver = new aws.ec2.Instance("webserver", {
    instanceType: size,
    ami: ami.id,
    userData: userData,
    vpcSecurityGroupIds: [www_group.id],
    subnetId: web_subnet.id,
});

const appserver = new aws.ec2.Instance("appserver", {
    instanceType: size,
    ami: ami.id,
    userData: userData,
    vpcSecurityGroupIds: [app_group.id],
    subnetId: app_subnet.id,
});

const bastion = new aws.ec2.Instance("bastion", {
    instanceType: size,
    ami: ami.id,
    vpcSecurityGroupIds: [bastion_group.id],
    subnetId: bastion_subnet.id,
});

export const WebserverPublicIp = webserver.publicIp;
export const WebserverPublicHostName = webserver.publicDns;
export const BastionPublicIp = bastion.publicIp;
export const BastionPublicHostname = bastion.publicDns;

