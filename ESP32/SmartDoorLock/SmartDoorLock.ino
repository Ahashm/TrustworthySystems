// Libraries
#include <WiFi.h>
#include <WiFiClient.h>
#include <SPI.h>     //https://www.arduino.cc/en/reference/SPI
#include <Arduino.h> //Maybe remove
#include <stdint.h>  // Maybe remove
#include <MFRC522.h> //https://github.com/OSSLibraries/Arduino_MFRC522v2
#include <PubSubClient.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>
// Time Libraries
#include <iostream>
#include <chrono>
#include <thread>
#include "time.h"
#include <TimeLib.h>

// RDIF
//  Constants
#define SS_PIN 5
#define RST_PIN 0
// Parameters
const int ipaddress[4] = {103, 97, 67, 25};
// Variables
byte nuidPICC[4] = {0, 0, 0, 0};
MFRC522::MIFARE_Key key;
MFRC522 rfid = MFRC522(SS_PIN, RST_PIN);

// Network
const char *ssid = "SSID";
const char *password = "PASSWORD";

// NTP client settings
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

// JSON buffer size
const size_t bufferSize = JSON_OBJECT_SIZE(18);

// MQTT Broker
// const char *mqtt_broker = "192.168.52.129";
const char *mqtt_broker = "192.168.239.91";
//const char *mqtt_broker = "broker.hivemq.com";
const char *topic = "lock/44215962539792/actions";
const char *heartbeatTopic = "heartbeats";
const char *mqtt_username = "root";
const char *mqtt_password = "root";
const int mqtt_port = 1885;
//const int mqtt_port = 1883;

// Auxiliar variables to store the current output state
String redLED_State = "false";
String blueLED_State = "false";
String whiteLED_State = "false";
String greenLED_State = "false";

// Assign output variables to GPIO pins
const int redLED = 25;   // RedLED
const int blueLED = 26;  // BlueLED
const int whiteLED = 32; // WhiteLED
const int greenLED = 33; // GreenLED

// Current time
unsigned long currentTime = millis();
// Previous time
unsigned long previousTime = 0;
// Define timeout time in milliseconds (example: 2000ms = 2s)
const long timeoutTime = 2000;

//Time
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

WiFiClient espClient;
PubSubClient client(espClient);

// Ultrasonic Sensor
const int trigPin = 14;
const int echoPin = 12;

// define sound speed in cm/uS
#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701

long duration;
float distanceCm;
float distanceInch;

String localTime()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return "failed";
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return timeStringBuff;
}

void setup()
{
  Serial.begin(115200);
  // Initialize the output variables as outputs
  pinMode(redLED, OUTPUT);
  pinMode(blueLED, OUTPUT);
  pinMode(whiteLED, OUTPUT);
  pinMode(greenLED, OUTPUT);
  // Initialize LED states
  digitalWrite(redLED, HIGH);
  digitalWrite(blueLED, LOW);
  digitalWrite(whiteLED, LOW);
  digitalWrite(greenLED, LOW);
  redLED_State = "true";
  blueLED_State = "false";
  whiteLED_State = "false";
  greenLED_State = "false";
  // Ultrasonic Sensor
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT);  // Sets the echoPin as an Input

  // connecting to a WiFi network
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println("Connected to the WiFi network");

  // connecting to a mqtt broker
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  while (!client.connected())
  {
    String client_id = "esp32-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("The client %s connects to the public mqtt broker\n", client_id.c_str());
    if (client.connect(client_id.c_str(), mqtt_username, mqtt_password))
    {
      Serial.println("Public emqx mqtt broker connected");
    }
    else
    {
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }
  // publish and subscribe
  client.publish(topic, "Connected from ESP32");
  client.subscribe(topic);
  client.subscribe(heartbeatTopic);

  Serial.println(F("Initialize System"));
  // init rfid D8,D5,D6,D7
  SPI.begin();
  rfid.PCD_Init();
  Serial.print(F("Reader :"));
  rfid.PCD_DumpVersionToSerial();

  // Initialize NTP client
  timeClient.begin();

  //init and get the time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  localTime();
  heartbeat();
}

void publishMessageMQTT(const char* topic, const char* message)
{
  //String str = message;

  // Length (with one extra character for the null terminator)
  //int str_len = str.length() + 1;

  // Prepare the character array (the buffer)
  //char char_array[str_len];

  // Copy it over
  //str.toCharArray(char_array, str_len);
  if (client.publish(topic, message)) {
    Serial.println("Publish Success");
  } else {
    Serial.println("Failed to send message.");
    Serial.print("Error code: ");
    Serial.println(client.state());
    Serial.println(" - ");
    delay(1000);
  }

}

void logIncident(String origin, String typeOfIncident, String idOfCard) {
  // Create JSON document
  StaticJsonDocument<300> jsonDoc;
  JsonObject json = jsonDoc.to<JsonObject>();
  JsonObject ledStates = jsonDoc.createNestedObject("States");

  // Get system information
  json["Id"] = ESP.getEfuseMac();
  json["TypeOfIncident"] = typeOfIncident;
  String dateTime = localTime();
  json["dateTime"] = dateTime;

  // States
  ledStates["RFID"] = blueLED_State;
  ledStates["doorLocked"] = redLED_State;
  ledStates["doorOpened"] = whiteLED_State;
  ledStates["doorUnlocked"] = greenLED_State;

  if (origin == "RFID") {
    json["RFID_id"] = idOfCard;
    json["origin"] == "RFID card used";
    json["DoorOpenDistance"] = "NULL";
  } else if (origin == "Client") {
    json["RFID_id"] = "NULL";
    json["origin"] = "Call from client";
    json["DoorOpenDistance"] = "NULL";
  } else if (origin == "DoorOpen") {
    json["DoorOpenDistance"] = idOfCard;
    json["RFID_id"] = "NULL";
    json["origin"] = "Call from client";
  } else if (origin = "default") {
    json["DoorOpenDistance"] = "NULL";
    json["RFID_id"] = "NULL";
    json["origin"] = "DoorStateChanged";
  } else if (origin = "heartbeat") {
    json["DoorOpenDistance"] = "NULL";
    json["RFID_id"] = "NULL";
    json["origin"] = "heartbeat sent";
  }

  // Serialize JSON document to string
  String jsonString;
  serializeJson(jsonDoc, jsonString);
  //serializeJsonPretty(jsonDoc, jsonString);
  //Serial.print(jsonString);
  const char *message = jsonString.c_str();

  // Send heartbeat message to server
  //Serial.println("HEARTBEAT SENDING");
  String espId = json["Id"].as<String>();

  String tempTopic = "lock/" + espId + "/events";
  const char *incidentTopic = tempTopic.c_str();
  publishMessageMQTT(incidentTopic, message);
  Serial.println("Incident happend.");
}


void setLED(int pin, String &state, bool desiredState)
{
  if (desiredState)
  {
    digitalWrite(pin, HIGH);
    state = "true";
  }
  else
  {
    digitalWrite(pin, LOW);
    state = "false";
  }
  logIncident("default", "Doorlock statechaned", "");
}


// function to convert timestamp string to time_t
time_t parseTimestamp(String timestamp) {
  int year, month, day, hour, minute, second;
  sscanf(timestamp.c_str(), "%d-%d-%d %d:%d:%d", &year, &month, &day, &hour, &minute, &second);
  struct tm timeinfo = {0};
  timeinfo.tm_year = year - 1900;
  timeinfo.tm_mon = month - 1;
  timeinfo.tm_mday = day;
  timeinfo.tm_hour = hour;
  timeinfo.tm_min = minute;
  timeinfo.tm_sec = second;
  return mktime(&timeinfo);
}

bool checkTimeElapsed(String currentESPTime, String serverTime) {
  // get current timestamp
  String currentTimestamp = currentESPTime;
  Serial.println("TimeNow: " + currentTimestamp);

  // get previous timestamp from server
  String previousTimestamp = serverTime;
  Serial.println("Servertime: " + previousTimestamp);

  // calculate elapsed time in seconds
  time_t currentTime = parseTimestamp(currentTimestamp);
  time_t previousTime = parseTimestamp(previousTimestamp);
  int elapsedSeconds = difftime(currentTime, previousTime);

  // check if elapsed time is less than 10 seconds
  if (elapsedSeconds <= 10) {
    Serial.println("Time is ok.");
    return true;
  } else {
    Serial.println("Time is NOT ok.");
    return false;
  }
}

void callback(char *topic, byte *payload, unsigned int length)
{
  if (strcmp(topic, "lock/44215962539792/actions") == 0)
  {
    Serial.println("Topic 1 hit---");
    String payloadStr = "";
    Serial.print("Message arrived in topic: ");
    Serial.println(topic);
    Serial.print("Message: ");
    for (int i = 0; i < length; i++)
    {
      Serial.print((char)payload[i]);
      payloadStr += (char)payload[i];
    }
    Serial.println();
    Serial.println("-----------------------");

    // Parse JSON string
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payloadStr);

    // Get message and date values
    const char* message = doc["message"];
    const char* date = doc["date"];

    String currentTime = localTime();
    Serial.println("");
    if (checkTimeElapsed(currentTime, date) == true) {
      if (strcmp(message, "unlock") == 0)
      {
        Serial.println("unlock door hit");
        setLED(redLED, redLED_State, false);
        setLED(greenLED, greenLED_State, true);
        logIncident("Client", "Doorlock unlocked", "Client");
      } else if (strcmp(message, "lock") == 0)
      {
        Serial.println("lock door hit");
        setLED(greenLED, greenLED_State, false);
        setLED(redLED, redLED_State, true);
        logIncident("Client", "Doorlock locked", "Client");
      } else {
        return;
      }
    }
  }
  else if (strcmp(topic, "heartbeats") == 0)
  {
    Serial.println("Topic 2 hit---");
    Serial.print("Message arrived in topic: ");
    Serial.println(topic);
    Serial.print("Message: ");
    for (int i = 0; i < length; i++)
    {
      Serial.print((char)payload[i]);
    }
    Serial.println();
    Serial.println("-----------------------");
    heartbeat();
    logIncident("heartbeat", "heartbeat", "");
  }
}

float ultrasonicSensor()
{
  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);

  // Calculate the distance
  distanceCm = duration * SOUND_SPEED / 2;

  // Convert to inches
  // distanceInch = distanceCm * CM_TO_INCH;

  // Prints the distance in the Serial Monitor
  //Serial.print("- Distance (cm): ");
  //Serial.println(distanceCm);

  // Serial.print("Distance (inch): ");
  // Serial.println(distanceInch);
  delay(1000);
  return distanceCm;
}

void readRFID(void)
{ /* function readRFID */
  ////Read RFID card
  for (byte i = 0; i < 6; i++)
  {
    key.keyByte[i] = 0xFF;
  }
  // Look for new 1 cards
  if (!rfid.PICC_IsNewCardPresent())
    return;
  // Verify if the NUID has been read
  if (!rfid.PICC_ReadCardSerial())
    return;
  // Store NUID into nuidPICC array
  for (byte i = 0; i < 4; i++)
  {
    nuidPICC[i] = rfid.uid.uidByte[i];
  }
  Serial.print(F("RFID In dec: "));
  printDec(rfid.uid.uidByte, rfid.uid.size);
  String rfid_idCode = "";
  for (int i = 0; i < rfid.uid.size; i++) {
    rfid_idCode += String(rfid.uid.uidByte[i], HEX);
  }
  logIncident("RFID", "RFID tag used", rfid_idCode);

  if (redLED_State == "true") {
    setLED(redLED, redLED_State, false);
    setLED(greenLED, greenLED_State, true);
    setLED(blueLED, blueLED_State, true);
    auto start_time = std::chrono::system_clock::now();
    while (std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now() - start_time).count() < 5)
    {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    setLED(blueLED, blueLED_State, false);
    logIncident("RFID", "RFID tag used", rfid_idCode);
  } else if (redLED_State == "false") {
    setLED(redLED, redLED_State, true);
    setLED(greenLED, greenLED_State, false);
    setLED(blueLED, blueLED_State, true);
    auto start_time = std::chrono::system_clock::now();
    while (std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now() - start_time).count() < 5)
    {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    setLED(blueLED, blueLED_State, false);
    logIncident("RFID", "RFID tag used", rfid_idCode);
  }
  Serial.println();
  // Halt PICC
  rfid.PICC_HaltA();
  // Stop encryption on PCD
  rfid.PCD_StopCrypto1();
}
/**
    Helper routine to dump a byte array as hex values to Serial.
*/
void printHex(byte *buffer, byte bufferSize)
{
  for (byte i = 0; i < bufferSize; i++)
  {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}
/**
    Helper routine to dump a byte array as dec values to Serial.
*/
void printDec(byte *buffer, byte bufferSize)
{
  for (byte i = 0; i < bufferSize; i++)
  {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], DEC);
  }
}

void heartbeat()
{
  // Create JSON document
  StaticJsonDocument<300> jsonDoc;
  JsonObject json = jsonDoc.to<JsonObject>();
  JsonObject sysInf = jsonDoc.createNestedObject("SystemInformation");
  JsonObject wifiInf = jsonDoc.createNestedObject("WifiInformation");
  JsonObject ledStates = jsonDoc.createNestedObject("States");

  // Get system information
  json["Id"] = ESP.getEfuseMac();
  sysInf["cpuFreq"] = ESP.getCpuFreqMHz();
  sysInf["freeMem"] = ESP.getFreeHeap();
  sysInf["heapSize"] = ESP.getHeapSize();
  String dateTime = localTime();
  sysInf["dateTime"] = dateTime;

  // Get Wi-Fi status
  wifiInf["ssid"] = WiFi.SSID();
  wifiInf["signalStrength"] = WiFi.RSSI();
  wifiInf["ipAddress"] = WiFi.localIP().toString();

  // States
  ledStates["RFID"] = blueLED_State;
  ledStates["doorLocked"] = redLED_State;
  ledStates["doorOpened"] = whiteLED_State;
  ledStates["doorUnlocked"] = greenLED_State;

  // Serialize JSON document to string
  String jsonString;
  serializeJson(jsonDoc, jsonString);
  //serializeJsonPretty(jsonDoc, jsonString);
  //Serial.print(jsonString);
  const char *message = jsonString.c_str();

  // Send heartbeat message to server
  //Serial.println("HEARTBEAT SENDING");

  String espId = json["Id"].as<String>();
  String tempTopic = "lock/" + espId + "/heartbeats";
  const char *incidentTopic = tempTopic.c_str();

  delay(1000);
  publishMessageMQTT(incidentTopic, message);
  Serial.println(tempTopic);
  Serial.println("---- HEARTBEAT SENT ----");
}

void loop()
{
  static unsigned long lastUltrasonicTime = 0;

  readRFID();
  int doorOpenDistance = ultrasonicSensor();
  String distanceToDoor = String(doorOpenDistance);

  if (doorOpenDistance >= 2)
  {
    if (millis() - lastUltrasonicTime >= 500)
    {
      lastUltrasonicTime = millis();
      setLED(whiteLED, whiteLED_State, true);
      logIncident("DoorOpen", "Door is open", distanceToDoor);
    }
  } else if (doorOpenDistance < 2) {
    if (millis() - lastUltrasonicTime >= 500)
    {
      lastUltrasonicTime = millis();
      setLED(whiteLED, whiteLED_State, false);
      logIncident("DoorOpen", "Door is closed", distanceToDoor);
    }
  }
  client.loop();
}
