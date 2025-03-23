import HTTPError from 'http-errors';

function echo(value: string) {
  if (value === 'echo') {
    throw HTTPError(400, 'Cannot echo "echo"');
  }
  return value;
}

export { echo };
