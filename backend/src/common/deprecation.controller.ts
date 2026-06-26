import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  getDeprecationMap,
  getActiveEndpoints,
  getTransitionalEndpoints,
  getDeprecatedEndpoints,
  type EndpointEntry,
} from './deprecation-map';

@ApiTags('Deprecation Map')
@Controller('api/v1/deprecation')
export class DeprecationController {
  @Get()
  @ApiOperation({
    summary: 'Get deprecation map for all pre-Soroban REST endpoints',
    description:
      'Returns a catalog of all backend REST endpoints with their active, transitional, or deprecated status.',
  })
  @ApiOkResponse({ description: 'Full deprecation map' })
  getAll(): EndpointEntry[] {
    return getDeprecationMap();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active (stable) endpoints' })
  getActive(): EndpointEntry[] {
    return getActiveEndpoints();
  }

  @Get('transitional')
  @ApiOperation({ summary: 'Get transitional endpoints' })
  getTransitional(): EndpointEntry[] {
    return getTransitionalEndpoints();
  }

  @Get('deprecated')
  @ApiOperation({ summary: 'Get deprecated endpoints' })
  getDeprecated(): EndpointEntry[] {
    return getDeprecatedEndpoints();
  }
}
