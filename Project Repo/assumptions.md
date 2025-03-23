1. All inputs are ASCII

Assuming that all strings and integers will be of ASCII type and that there will be no other 
types of inputs. This ensures that there are no foreign characters that the system does not recognise.

2. 'start' input for channelMessagesV3 is not negative 

We are assuming that the inputs will not attempt to access the array of messages using negative indexes which will cause unknown behaviour

3. 'start' is the same as the length of the the 'message' array

The specification states that there is an error returned if the start is greater than the total number of messages.
However if there is only one message, in index 0, then the length of the total number of messages is 1, and the starting
index is also 1 so they are equal. In this case we have assumed that an empty array will be returned. 

4. None of the inputs to the functions will result in an integer overflow

Any 'number' data type input does not exceed the number of numbers allowed in the 'number' data type, before it overflows (max safe integer of 2^53 - 1)
This in turn assumes that the number of users, channels and all other integer values do not exceed this value.

5. Password does not exceed the maximum string length

Any 'string' data type input does not exceed the number of characters allowed in the 'string' data types, maximum characters in javascript is (9007199254740991)

6. Only 1 Global Owner, 

We are assuming that the first user is the only global owner and no one else can become a global owner and therefore no one else has global permissions
