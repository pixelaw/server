
FROM node:22-bookworm as builder

# Install these packages for compiling canvas
RUN \
    apt-get update && \
    apt-get install -y \
      build-essential \
        libcairo2-dev \
        libjpeg-dev \
        libpango1.0-dev \
        libgif-dev \
        g++ \
      python3 && \
    apt-get autoremove && apt-get clean

# Set the working directory
WORKDIR /app


COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile



FROM node:22-bookworm-slim as runner
WORKDIR /app

RUN yarn global add ts-node

COPY --from=builder /app /app

# Bundle app source
COPY . .

ENV ACCOUNT_ADDRESS=0x0
ENV ACCOUNT_PK=0x0
ENV STORAGE_DIR="/app/storage"
ENV WEB_DIR="/app/web"

# Define the command to run your app using CMD which defines your runtime
CMD [ "ts-node", "src/index.ts" ]
