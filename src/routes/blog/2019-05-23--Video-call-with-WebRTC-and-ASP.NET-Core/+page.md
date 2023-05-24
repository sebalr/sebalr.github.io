---
title: 'Video call with WebRTC Angular and ASP.NET Core'
date: 2019-05-23
template: 'post'
published: true
draft: false
slug: 'Video-call-with-WebRTC-Angular-and-ASP.NET Core'
category: 'Tutorial'
tags:
  - 'Angular'
  - 'ASP.NET Core'
  - 'WebRTC'
  - 'SignalR'
  - 'Web Development'
description: 'How to build a basic video call app with Angular and webrtc and signalR as signaling channel.'
---

Hi everyone, in this post we will build a basic video call web using WebRTC,Angular and ASP.Net Core. Why? because this technologies are like read meat and malbec, their just pair well (I will write a post about this). This is going to be a very basic app with a lot of point for improvement but I will focus on basics.

WebRTC 'Supports video, voice, and generic data to be sent between peers', but as in any p2p system we need a signaling communication channel so users can discover each other, we will user singlaR for that.

Lets begin with Backend

We only need a signaling server so create a .Net Core web api project and add singalR nuget package

```
dotnet new webapp -o signalRtc
cd signalRtc
dotnet add package Microsoft.AspNetCore.SignalR.Core
```

You could remove the controller folder that is created.

Now we need a hub, as docs saids, a hub 'allows a client and server to call methods on each other', I like to think that we invoke methods from frontend and listen to event from backend. So create a hubs folder and a class that extends Hub.

```c#
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using signalRtc.models;

namespace signalRtc.hubs
{
    public class SignalRtcHub : Hub
    {
    }
}

```

There are 3 (or 4) basic actions that we need in order to make a video call app.

1. Every new user need to notify they arrival.
2. Existing users need to inform their presence to new user.
3. Share signaling data between peers for WebRTC.
4. Notify users when someone disconnect.

As I said, we are going to write task in the hub class that can be executed from the Angular project and send some data to frontend too.

First create a folder models with a UseInfo class to encapsulate user data

```c#
namespace signalRtc.models
{
    public class UserInfo
    {
        public string userName { get; set; }
        public string connectionId { get; set; }
    }
}
```

The connectionId it's an unique identifier that signlarR give to each connected user so we can identify they, we will need it to send messages to that specific user.

Point #1

```c#
public async Task NewUser(string username)
{
    var userInfo = new UserInfo() { userName = username, connectionId = Context.ConnectionId };
    await Clients.Others.SendAsync("NewUserArrived", JsonSerializer.Serialize(userInfo));
}
```

In this short piece of code we use many of the signalR great features. The task is the action that we can invoke from frontend, there we create a User object with the current user id that we get from Context. We don't want to receive our "hello I'm a new user" so we send the message to "others", that means all users connected to the hub but not me, signalR keep the list of user for us. The "NewUserArrived" string is an identifier that we will use later in frontend to receive this messages, you could write any name you like.

Point #2 When we get the "NewUser" message, we need to inform of our existence to the new user with a hello.

```c#
public async Task HelloUser(string userName, string user)
{
    var userInfo = new UserInfo() { userName = userName, connectionId = Context.ConnectionId };
    await Clients.Client(user).SendAsync("UserSaidHello", JsonSerializer.Serialize(userInfo));
}
```

The task receive two parameters, the username of the user that is saying hello and the user that we are saluting. In order to send a message to one user, we use Clients.Client('connectionId')... In this case, we are sending a "UserSaidHello" event to frontend.

Point #3 is simple, we want to send our signal to a user to start a p2p videocall

```c#
public async Task SendSignal(string signal, string user)
{
    await Clients.Client(user).SendAsync("SendSignal", Context.ConnectionId, signal);
}
```

Last but not essential, we want to inform to the group when a user disconnect, to do that we are going to override the onDisconnect task.

```c#
public override async Task OnDisconnectedAsync(System.Exception exception)
{
    await Clients.All.SendAsync("UserDisconnect", Context.ConnectionId);
    await base.OnDisconnectedAsync(exception);
}
```

We are almost done with backend, we need to indicate to NetCore that we are using singlaR so in the Startup.cs add singalR in configureService (also cors for angular port) and an endpoint for the singalR communication

```c#
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy(MyAllowSpecificOrigins,
            builder => builder.WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
    });

    services.AddSignalR();
}

readonly string MyAllowSpecificOrigins = "AllowOrigins";


public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }

    app.UseRouting();
    app.UseCors(MyAllowSpecificOrigins);
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapHub<SignalRtcHub>("/signalrtc");
    });

    app.Run(async(context) =>
    {
        await context.Response.WriteAsync("Hello World!");
    });
}

```

Lets move to Angular
First create a new Angular project and install few dependencies.
simple-peer (and its types, because we love static type checking) for WebRTC.
Bootrstap, because I know you could do everything with plain css and flex or grid, but I like bootstrap.
SignalR, to invoke the method we just wrote and receive the messages.
Remember to choose scss when cli ask.

```
ng new signalRtc
cd signalRtc
npm install simple-peer
npm install @types/simple-peer
npm install bootstrap
npm install @aspnet/signalr
```

To add sytles, open styles.scss and add "@import '~bootstrap/dist/css/bootstrap.min.css';"

First lets create a service to manage the singalR messages.

```
cd src/app
ng g service signalr
```

We need a private property to maintain the hub connection, we also need subjects and observables to encapsulate the events from signalR library. I like to have private subjects to emit values via methods and public observables to get data in components.

```ts
private hubConnection: signalR.HubConnection;

private newPeer = new Subject<UserInfo>();
public newPeer$ = this.newPeer.asObservable();

private helloAnswer = new Subject<UserInfo>();
public helloAnswer$ = this.helloAnswer.asObservable();

private disconnectedPeer = new Subject<UserInfo>();
public disconnectedPeer$ = this.disconnectedPeer.asObservable();

private signal = new Subject<SignalInfo>();
public signal$ = this.signal.asObservable();
```

As you can see, we have an observable for every task and some interfaces that you could write in a separate file

```ts
export interface PeerData {
	id: string;
	data: any;
}

export interface UserInfo {
	userName: string;
	connectionId: string;
}

export interface SignalInfo {
	user: string;
	signal: any;
}
```

Now we will write some methods, we need one to start a connection, one for response to the new user message and one to send the p2p signal

Start a connection

```c#
  public async startConnection(currentUser: string): Promise<void> {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/signalrtc')
      .build();

    await this.hubConnection.start();
    console.log('Connection started');

    this.hubConnection.on('NewUserArrived', (data) => {
      this.newPeer.next(JSON.parse(data));
    });

    this.hubConnection.on('UserSaidHello', (data) => {
      this.helloAnswer.next(JSON.parse(data));
    });

    this.hubConnection.on('UserDisconnect', (data) => {
      this.disconnectedPeer.next(JSON.parse(data));
    });

    this.hubConnection.on('SendSignal', (user, signal) => {
      this.signal.next({ user, signal });
    });

    this.hubConnection.invoke('NewUser', currentUser);
  }
```

As you can see from code, we start the connection and encapsulate the message events in observables, also when we start a connection we send the 'Hello I'm a new user' message. That's the two way communication with backend, via invoke we execute task and receive data with 'on'.

Now to say hello new user and send signal data, we only need to invoke hub methods

```ts
public sendSignalToUser(signal: string, user: string) {
  this.hubConnection.invoke('SendSignal', signal, user);
}

public sayHello(userName: string, user: string): void {
  this.hubConnection.invoke('HelloUser', userName, user);
}

```

Now we are going to write a rtc service, similar to the signalR one, to encapsulate the simplee-peer events. We also need to maintain the list of connected users to start a conversation and the current peer we are talking to.

```ts
import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Instance } from 'simple-peer';

declare var SimplePeer: any;

@Injectable({
	providedIn: 'root'
})
export class RtcService {
	private users: BehaviorSubject<Array<UserInfo>>;
	public users$: Observable<Array<UserInfo>>;

	private onSignalToSend = new Subject<PeerData>();
	public onSignalToSend$ = this.onSignalToSend.asObservable();

	private onStream = new Subject<PeerData>();
	public onStream$ = this.onStream.asObservable();

	private onConnect = new Subject<PeerData>();
	public onConnect$ = this.onConnect.asObservable();

	private onData = new Subject<PeerData>();
	public onData$ = this.onData.asObservable();

	public currentPeer: Instance;

	constructor() {
		this.users = new BehaviorSubject([]);
		this.users$ = this.users.asObservable();
	}
}
```

When a user arrives, we add it to the list, and when they disconnect, we remove it (always in an immutable way), let’s add some methods in service for that

```ts
 public newUser(user: UserInfo): void {
  this.users.next([...this.users.getValue(), user]);
}

public disconnectedUser(user: UserInfo): void {
  const filteredUsers = this.users.getValue().filter(x => x.connectionId === user.connectionId);
  this.users.next(filteredUsers);
}
```

When we start a conversation, we need to create a peer instance. The simple peer library need and indication to know if we are initiating the p2p connection. It also provide some events that we will encapsulate (because we love observables). The most important event is 'signal', quoting the library description: 'Fired when the peer wants to send signaling data to the remote peer.

It is the responsibility of the application developer (that's you!) to get this data to the other peer' that's the whole point of signalR

```ts
  public createPeer(stream, userId: string, initiator: boolean): Instance {
    const peer = new SimplePeer({ initiator, stream });

    peer.on('signal', data => {
      const stringData = JSON.stringify(data);
      this.onSignalToSend.next({ id: userId, data: stringData });
    });

    peer.on('stream', data => {
      console.log('on stream', data);
      this.onStream.next({ id: userId, data });
    });

    peer.on('connect', () => {
      this.onConnect.next({ id: userId, data: null });
    });

    peer.on('data', data => {
      this.onData.next({ id: userId, data });
    });

    return peer;
  }
```

Finally, we have a method to signal a peer Instance, this actions is required by simple-peer. We have to check if exist a current peer, if it don't, it means that we are not the initiator and we have to create it because someone is staring a videocall with us

```ts
public signalPeer(userId: string, signal: string, stream: any) {
    const signalObject = JSON.parse(signal);
    if (this.currentPeer) {
      this.currentPeer.signal(signalObject);
    } else {
      this.currentPeer = this.createPeer(stream, userId, false);
      this.currentPeer.signal(signalObject);
    }
  }

public sendMessage(message: string) {
  this.currentPeer.send(message);
}
```

We also create a sendMessage for the chat part, because WebRTC allow to send binary data between peers. We could have used signalR but we only want it as a signaling server.

Now let's change app.component.htm, we will add an input for our username and a place for a chat. Following good practice, we will make a special component to manage the connected users list to keep a place for that.

```html
<div class="container-fluid">
	<h1>SignalRTC</h1>
	<div class="row">
		<div class="col-5">
			<div class="row">
				<div class="col">
					<input [(ngModel)]="currentUser" required placeholder="UserName" type="text" />
				</div>
				<div class="col">
					<div class="btn-group" role="group" aria-label="button group">
						<button
							[disabled]="!currentUser"
							(click)="saveUsername()"
							type="button"
							class="btn btn-sm btn-primary"
						>
							Save
						</button>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col">
					<!-- user list component -->
				</div>
			</div>
		</div>
		<div class="col-7">
			<div class="row">
				<div class="col-8">
					<input [(ngModel)]="dataString" required placeholder="Write a message" type="text" />
				</div>
				<div class="col-4">
					<button (click)="sendMessage()" type="button" class="btn btn-sm btn-secondary">
						Send
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
```

This is the list component,just a simple list where we can click an user in order to start a videocall, the component will emit an event so we can react in the app component.

```ts
<ul class="list-group mt-4">
  <li class="list-group-item" (click)="userClicked(user)" *ngFor="let user of users$ | async">
    {{user.userName}}
  </li>
</ul>
```

```ts
 @Output() userSelected: EventEmitter<UserInfo> = new EventEmitter();

  public users$: Observable<Array<UserInfo>>;


  constructor(private rtcService: RtcService) { }

  ngOnInit() {
    this.users$ = this.rtcService.users$;
  }

  public userClicked(user: UserInfo) {
    this.userSelected.emit(user);
  }

```

Now you can change the app.component.html and replace the comment for the actual list component.

```ts
<app-user-list (userSelected)="onUserSelected($event)"></app-user-list>
```

In the component, we will use the OnInit method (in Angular we have to keep constructor clean) to suscribe to all the obserable we defined and disptach the actions we need.

```ts
ngOnInit() {
    this.subscriptions.add(this.signalR.newPeer$.subscribe((user: UserInfo) => {
      this.rtcService.newUser(user);
      this.signalR.sayHello(this.currentUser, user.connectionId);
    }));

    this.subscriptions.add(this.signalR.helloAnswer$.subscribe((user: UserInfo) => {
      this.rtcService.newUser(user);
    }));

    this.subscriptions.add(this.signalR.disconnectedPeer$.subscribe((user: UserInfo) => {
      this.rtcService.disconnectedUser(user);
    }));

    this.subscriptions.add(this.signalR.signal$.subscribe((signalData: SignalInfo) => {
      this.rtcService.signalPeer(signalData.user, signalData.signal, this.stream);
    }));

    this.subscriptions.add(this.rtcService.onSignalToSend$.subscribe((data: PeerData) => {
      this.signalR.sendSignalToUser(data.data, data.id);
    }));

    this.subscriptions.add(this.rtcService.onData$.subscribe((data: PeerData) => {
      console.log(`Data from user ${data.id}: ${data.data}`);
    }));

    this.subscriptions.add(this.rtcService.onStream$.subscribe((data: PeerData) => {
      this.userVideo = data.id;
      this.videoPlayer.nativeElement.srcObject = data.data;
      this.videoPlayer.nativeElement.load();
      this.videoPlayer.nativeElement.play();
    }));
  }

```

Brief explanation of each step:

1. When a user arrives, we add create a new user and send our hell message.
2. When we receive a hello, we add the user to the list.
3. When a user disconnect, we remove it from the list.
4. When when receive a signal we execute the function .signal that it's indicated in the simple-peer documentation.
5. When simple-peer indicate that the WeRTC signal is ready, we send it to the user.
6. When we receive a message, we show it.
7. Finally, when the videostream is ready, we show it in a video tag.

Finally, when we click a user, we create a new peer, this will eventually fire the signal event!
We also have the function to save the username and send a message via the data channel. Also unsubscribe always on the OnDestroy lifecycle hook, in this case we have only one component but following this practice we will prevent memory leaks.

```ts
public onUserSelected(userInfo: UserInfo) {
    const peer = this.rtcService.createPeer(this.stream, userInfo.connectionId, true);
    this.rtcService.currentPeer = peer;
  }

  public async saveUsername(): Promise<void> {
    try {
      await this.signalR.startConnection(this.currentUser);
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      console.error(`Can't join room, error ${error}`);
    }
  }

  public sendMessage() {
    this.rtcService.sendMessage(this.dataString);
    this.messages = [...this.messages, { own: true, message: this.dataString }];
    this.dataString = null;
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
```

Okey, that's all folks. As I told you at the beginning, this is a ver

Here I left the Angular and .Net Core git project so you can check. I left the chat css and html without mention but you could find it in the repo.y simple starting point.
We have a lot to improve, for example you could use signalR yo ask to the other user if they want to accept the call! I wanted to keep it simple.
